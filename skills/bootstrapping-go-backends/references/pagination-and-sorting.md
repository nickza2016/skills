# Pagination and sorting

Every list endpoint is paginated with `pkg/api.Paginate` and sorted with `pkg/rest.Sort`.

Render [paginate.go](../assets/pkg/api/paginate.go.tmpl) into `pkg/api/` (needs `github.com/acoshift/paginate`) and [sort.go](../assets/pkg/rest/sort.go.tmpl) into `pkg/rest/`, replacing `__MODULE__` with the module path. `sort.go` needs `codes.InvalidSortOrder` and `codes.InvalidSortColumn` in `pkg/codes`.

## Wire shape

- Request: `"paginate": {"page": 1, "perPage": 20}`, `"sort": {"column": "createdAt", "order": "desc"}`. `perPage` defaults to 50 and is capped at 1000.
- Response: `items` plus `paginate` with `page`, `perPage`, `next`, and `totalCount` when `CountTotal` ran.

## List function pattern

See the `List` example in [writing functions](writing-functions.md).

1. Declare `ListParams` (`Paginate api.Paginate`, `Sort rest.Sort`, filters), `ListItem`, and `ListResult` (`Items`, `Paginate api.Paginate`) directly above the function.
2. In `Valid()`, call `p.Sort.ValidateSort(ListItem{})` so only columns with `json`/`db` tags are sortable.
3. Build one `filter := func(b pgstmt.Cond)` and reuse it for every query.
4. `p.Paginate.CountTotal(...)` only when allowed by the [CountTotal decision](writing-functions.md#lists-and-counttotal) (never when the filter can match more than 100,000 rows): `count(*)` over a `FromSelect` subquery with the filter.
5. `p.Paginate.Count(...)`: the same subquery plus `b.Offset(p.Paginate.CountOffset())` and `b.Limit(p.Paginate.CountLimit())`; this sets `next`.
6. Items: `pgstmt.Select`, `b.Where(filter)`, `p.Sort.Do(b)` (or a fixed `OrderBy`), then `b.Limit(p.Paginate.Limit())` and `b.Offset(p.Paginate.Offset())`, read with `IterWith`.
7. Return `items` as `make([]T, 0)` so an empty list is `[]`.

Do not use `CountOffset`/`CountLimit` on the items query: `CountLimit` is `perPage + 1` and returns one extra row. Do not use the old `pkg/rest.Paginate` (`page`/`limit`).
