# Writing feature functions

Rules for every feature function. The `item` resource below is illustrative only; use the target's real names.

## Rules

- **One file per feature.** Put each function's `XxxParams`, `Valid()`, and `XxxResult`/`XxxItem` types directly above that function. Do not split params/results into other files, and do not create a new file unless the code is reused; reused code goes in `pkg/`.
- **No single-use helpers or methods.** Do not create a helper function, method, or intermediate record struct (for example `row.view()`, `row.listItem()`, `scanX()`) that has only one caller; write that code inside the function. Extract only when two or more functions call it. Prefer mapping in SQL (`coalesce(x, '{}')`, `x IS NOT NULL AS flag`) and scanning straight into the result type over converting through extra structs.
- **Signature:** `func Xxx(ctx context.Context, p *XxxParams) (*XxxResult, error)`, or `error` only when there is no result.
- **Order inside the function:** authorize → `p.Valid()` → query/transaction → result.
- **Validation:** `validator.New()`, `v.Must(cond, "field is required")`, `return v.Error()`. Messages name the JSON field.
- **SQL:** only pgstmt and pgctx. Use pgstmt for anything with filters, joins, or optional fields; use `pgctx.QueryRow`/`pgctx.Exec`/`pgctx.Iter` for short fixed SQL with `$n` binds. If a query cannot be written with them, ask the user first.
- **Transactions:** `pgctx.RunInTx` when two or more writes must succeed together; use the callback `ctx` inside.
- **Errors:** declare typed errors at the top of the file with `arpc.NewErrorCode`. Map `sql.ErrNoRows` (with `errors.Is`) to not-found, unique violations (`pgsql.IsUniqueViolation`) to a conflict error, and `RowsAffected() == 0` to not-found. Return every other error unchanged; never hide it as not-found.
- **Updates:** pointer fields for optional values; set only fields that are non-nil.
- **Big numbers:** do not mutate inputs; use `new(big.Int).Add(a, b)`.
- **Swagger:** every exposed function has `@Summary`, `@Tags`, `@Param`, `@Success`, `@Failure`, `@Security`, `@Router` comments.

## Lists and `CountTotal`

Every list is paginated with `pkg/api.Paginate` and sorted with `pkg/rest.Sort`; see [pagination and sorting](pagination-and-sorting.md).

Before writing a list, decide whether it calls `CountTotal`:

- Estimate how many rows the list's filter can match as the data grows (logs, transactions, history, and event tables grow without bound).
- If it can exceed **100,000 rows**, do not call `CountTotal`. Use only `Count`, which is bounded and still sets `next`.
- Otherwise call `CountTotal` only when the client needs `totalCount`.
- If the size is unclear, ask the user. State the decision in the handoff.

## Example

```go
var (
	ErrItemNotFound      = arpc.NewErrorCode("item-not-found", "item: not found")
	ErrItemAlreadyExists = arpc.NewErrorCode("item-already-exists", "item: already exists")
)

type CreateParams struct {
	Name string `json:"name"`
}

func (p *CreateParams) Valid() error {
	v := validator.New()
	v.Must(p.Name != "", "name is required")
	return v.Error()
}

type CreateResult struct {
	ID string `json:"id"`
}

// Create creates an item.
//
// @Summary     Create item
// @Tags        Item
// @Accept      json
// @Produce     json
// @Param       request  body      CreateParams  true  "Item data"
// @Success     200      {object}  CreateResult
// @Failure     400      {object}  ErrorResponse
// @Security    BearerAuth
// @Router      /item.create [post]
func Create(ctx context.Context, p *CreateParams) (*CreateResult, error) {
	if err := iam.Authorize(ctx, permission.ItemCreate); err != nil {
		return nil, err
	}
	if err := p.Valid(); err != nil {
		return nil, err
	}

	var res CreateResult
	err := pgstmt.Insert(func(b pgstmt.InsertStatement) {
		b.Into("items")
		b.Columns("name", "owner_id")
		b.Value(p.Name, auth.AccountID(ctx))
		b.Returning("id")
	}).QueryRowWith(ctx).Scan(&res.ID)
	if pgsql.IsUniqueViolation(err, "items_name_idx") {
		return nil, ErrItemAlreadyExists
	}
	if err != nil {
		return nil, err
	}
	return &res, nil
}

type UpdateParams struct {
	ID   string  `json:"id"`
	Name *string `json:"name"`
}

func (p *UpdateParams) Valid() error {
	v := validator.New()
	v.Must(p.ID != "", "id is required")
	if p.Name != nil {
		v.Must(*p.Name != "", "name is required")
	}
	return v.Error()
}

func Update(ctx context.Context, p *UpdateParams) error {
	if err := iam.Authorize(ctx, permission.ItemUpdate); err != nil {
		return err
	}
	if err := p.Valid(); err != nil {
		return err
	}

	r, err := pgstmt.Update(func(b pgstmt.UpdateStatement) {
		b.Table("items")
		if p.Name != nil {
			b.Set("name").To(*p.Name)
		}
		b.Set("updated_at").To("now()")
		b.Where(func(b pgstmt.Cond) {
			b.Eq("id", p.ID)
			b.IsNull("deleted_at")
		})
	}).ExecWith(ctx)
	if err != nil {
		return err
	}
	if n, _ := r.RowsAffected(); n == 0 {
		return ErrItemNotFound
	}
	return nil
}

type ListParams struct {
	Search   string       `json:"search"`
	Sort     rest.Sort    `json:"sort"`
	Paginate api.Paginate `json:"paginate"`
}

func (p *ListParams) Valid() error {
	v := validator.New()
	if err := p.Sort.ValidateSort(ListItem{}); err != nil {
		v.Add(err)
	}
	return v.Error()
}

type ListItem struct {
	ID        string    `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

type ListResult struct {
	Items    []*ListItem  `json:"items"`
	Paginate api.Paginate `json:"paginate"`
}

func List(ctx context.Context, p *ListParams) (*ListResult, error) {
	if err := iam.Authorize(ctx, permission.ItemList); err != nil {
		return nil, err
	}
	if err := p.Valid(); err != nil {
		return nil, err
	}

	filter := func(b pgstmt.Cond) {
		b.IsNull("deleted_at")
		if p.Search != "" {
			b.ILike("name", "%"+p.Search+"%")
		}
	}

	// items can stay small, so CountTotal is allowed; drop it if the table can exceed 100k rows.
	err := p.Paginate.CountTotal(func() (n int64, err error) {
		err = pgstmt.Select(func(b pgstmt.SelectStatement) {
			b.Columns("count(*)")
			b.FromSelect(func(b pgstmt.SelectStatement) {
				b.Columns("1")
				b.From("items")
				b.Where(filter)
			}, "t")
		}).QueryRowWith(ctx).Scan(&n)
		return
	})
	if err != nil {
		return nil, err
	}

	err = p.Paginate.Count(func() (n int64, err error) {
		err = pgstmt.Select(func(b pgstmt.SelectStatement) {
			b.Columns("count(*)")
			b.FromSelect(func(b pgstmt.SelectStatement) {
				b.Columns("1")
				b.From("items")
				b.Where(filter)
				b.Offset(p.Paginate.CountOffset())
				b.Limit(p.Paginate.CountLimit())
			}, "t")
		}).QueryRowWith(ctx).Scan(&n)
		return
	})
	if err != nil {
		return nil, err
	}

	items := make([]*ListItem, 0)
	err = pgstmt.Select(func(b pgstmt.SelectStatement) {
		b.Columns("id", "name", "created_at")
		b.From("items")
		b.Where(filter)
		if p.Sort.Column != "" {
			p.Sort.Do(b)
		} else {
			b.OrderBy("created_at DESC")
		}
		b.Limit(p.Paginate.Limit())
		b.Offset(p.Paginate.Offset())
	}).IterWith(ctx, func(scan pgsql.Scanner) error {
		var it ListItem
		if err := scan(&it.ID, &it.Name, &it.CreatedAt); err != nil {
			return err
		}
		items = append(items, &it)
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &ListResult{Items: items, Paginate: p.Paginate}, nil
}
```

`iam`, `auth`, and `permission` stand for the target's own authorization and identity packages.
