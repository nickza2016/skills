# HTTP application: `handler.go` and `main.go`

Write every HTTP application's `<app>/handler.go` and `cmd/<app>/main.go` exactly in this shape. Names (`myapi`, `item`, `example.com/project`) are illustrative only.

## Rules

- **Imports:** three groups separated by blank lines: standard library, third-party, this module. Aliases are lowercase without underscores (`myapiauth`, not `studio_auth`); alias only when two packages share a name.
- **Route groups:** one named variable per access level (`signedIn`, `verified`). Never reassign a group variable (`m = m.Group(...)`).
- **Route order:** inside a group, one `// <resource>` comment then that resource's routes. Paths are `POST /<resource>.<action>`, and the resource matches the Go package that handles it.
- **Middleware:** declare its errors once in a `var` block. Parse the header with `strings.CutPrefix`. Put values in context with typed keys inline (`context.WithValue(ctx, pinVerifiedKey{}, v)`); no single-use wrapper functions. Map only "invalid token" to unauthorized; return other errors unchanged.
- **`main.go`:** `main` only calls `run()` and exits non-zero on error, so every `defer` runs. Never call `log.Fatal` after a `defer`. Configure the pool, then `PingContext` with a timeout before serving. Config keys match their setters (`db_conn_max_lifetime` → `SetConnMaxLifetime`).
- **Shutdown:** `parapet.NewBackend()` already handles SIGTERM with a 30-second grace period; do not add another signal handler.
- **Port:** default `80`, matching the Nortezh workflow, which sends no `port`.

## `myapi/handler.go`

```go
package myapi

import (
	"context"
	"errors"
	"strings"

	"github.com/acoshift/arpc/v2"
	"github.com/moonrhythm/httpmux"

	myapiauth "example.com/project/myapi/auth"
	"example.com/project/myapi/item"
	"example.com/project/pkg/auth"
)

func Mount(mux *httpmux.Mux, am *arpc.Manager) {
	// public
	mux.Handle("POST /auth.signIn", am.Handler(myapiauth.SignIn))

	signedIn := mux.Group("/", am.Middleware(authMiddleware))
	signedIn.Handle("POST /auth.pinSignIn", am.Handler(myapiauth.PinSignIn))

	verified := signedIn.Group("/", am.Middleware(pinVerifiedMiddleware))

	// auth
	verified.Handle("POST /auth.signOut", am.Handler(myapiauth.SignOut))
	verified.Handle("POST /auth.profile", am.Handler(myapiauth.Profile))

	// item
	verified.Handle("POST /item.create", am.Handler(item.Create))
	verified.Handle("POST /item.get", am.Handler(item.Get))
	verified.Handle("POST /item.list", am.Handler(item.List))
	verified.Handle("POST /item.update", am.Handler(item.Update))
	verified.Handle("POST /item.delete", am.Handler(item.Delete))
}

var (
	errMissingAuthorization = arpc.NewErrorCode("missing-authorization", "missing authorization")
	errInvalidAuthorization = arpc.NewErrorCode("invalid-authorization", "invalid authorization")
	errUnauthorized         = arpc.NewErrorCode("unauthorized", "unauthorized")
)

type pinVerifiedKey struct{}

func authMiddleware(actx *arpc.MiddlewareContext) error {
	header := actx.Request().Header.Get("Authorization")
	if header == "" {
		return errMissingAuthorization
	}
	token, ok := strings.CutPrefix(header, "Bearer ")
	if !ok || token == "" {
		return errInvalidAuthorization
	}

	ctx := actx.Request().Context()
	accountID, pinVerified, err := myapiauth.ValidateToken(ctx, token)
	if errors.Is(err, myapiauth.ErrInvalidToken) {
		return errUnauthorized
	}
	if err != nil {
		return err
	}

	ctx = auth.WithAccountID(ctx, accountID)
	ctx = auth.WithToken(ctx, token)
	ctx = context.WithValue(ctx, pinVerifiedKey{}, pinVerified)
	actx.SetRequestContext(ctx)
	return nil
}

func pinVerifiedMiddleware(actx *arpc.MiddlewareContext) error {
	verified, _ := actx.Request().Context().Value(pinVerifiedKey{}).(bool)
	if !verified {
		return errUnauthorized
	}
	return nil
}
```

## `cmd/myapi/main.go`

```go
package main

import (
	"context"
	"database/sql"
	"log/slog"
	"os"
	"time"

	"github.com/acoshift/arpc/v2"
	"github.com/acoshift/configfile"
	"github.com/acoshift/pgsql/pgctx"
	_ "github.com/lib/pq"
	"github.com/moonrhythm/httpmux"
	"github.com/moonrhythm/parapet"
	"github.com/moonrhythm/parapet/pkg/requestid"

	"example.com/project/myapi"
	"example.com/project/pkg/api"
	"example.com/project/pkg/rest"
)

func main() {
	if err := run(); err != nil {
		slog.Error("myapi: exit", "error", err)
		os.Exit(1)
	}
}

func run() error {
	cfg := configfile.NewEnvReader()

	db, err := sql.Open("postgres", cfg.MustString("db_url"))
	if err != nil {
		return err
	}
	defer db.Close()
	db.SetMaxOpenConns(cfg.IntDefault("db_max_open_conns", 10))
	db.SetMaxIdleConns(cfg.IntDefault("db_max_idle_conns", 5))
	db.SetConnMaxLifetime(cfg.DurationDefault("db_conn_max_lifetime", 5*time.Minute))
	db.SetConnMaxIdleTime(cfg.DurationDefault("db_conn_max_idle_time", time.Minute))

	pingCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	err = db.PingContext(pingCtx)
	cancel()
	if err != nil {
		return err
	}

	am := arpc.New()
	am.WrapError = myapi.WrapError
	am.OnOK(myapi.OnOK)
	am.OnError(myapi.OnError)

	mux := httpmux.New()
	myapi.Mount(mux, am)

	s := parapet.NewBackend()
	s.Handler = mux
	s.UseFunc(pgctx.Middleware(db))
	s.Use(requestid.New())
	s.UseFunc(rest.Recovery)
	s.UseFunc(api.RequestInfoMiddleware)
	s.Addr = ":" + cfg.StringDefault("port", "80")

	slog.Info("myapi: listen", "addr", s.Addr)
	return s.ListenAndServe()
}
```

Render [recovery.go](../assets/pkg/rest/recovery.go.tmpl) into `pkg/rest/` and [request.go](../assets/pkg/api/request.go.tmpl) into `pkg/api/`. Handlers read the client IP and user agent with `api.RequestInfoFromContext(ctx)`.

`WrapError`, `OnOK`, `OnError` live in `myapi/rest.go`. API docs are a separate static site, not served by the app; see [documenting-apis](../../documenting-apis/SKILL.md). Add other clients (storage, observability) the same way: create in `run()`, `defer Close()`, then register their middleware with `s.UseFunc`/`s.Use`.
