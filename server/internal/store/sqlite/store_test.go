package sqlite

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/starazzip/cocos-automation-testing-demo/server/internal/domain"
)

func TestApplySpinRecordsStepBalances(t *testing.T) {
	ctx := context.Background()
	store, err := Open(filepath.Join(t.TempDir(), "slot.db"))
	if err != nil {
		t.Fatalf("open sqlite store: %v", err)
	}
	defer store.Close()

	config := domain.DefaultConfig()
	if err := store.EnsureDefaults(ctx, config); err != nil {
		t.Fatalf("ensure defaults: %v", err)
	}
	if _, err := store.CreditIn(ctx, config.LocalPlayer, 100); err != nil {
		t.Fatalf("credit in: %v", err)
	}

	evaluation, err := domain.Evaluate(domain.Board{
		{"A", "A", "A"},
		{"K", "Q", "K"},
		{"7", "A", "7"},
	}, 1, config.PayTable)
	if err != nil {
		t.Fatalf("evaluate: %v", err)
	}
	balance, _, err := store.ApplySpin(ctx, config.LocalPlayer, evaluation)
	if err != nil {
		t.Fatalf("apply spin: %v", err)
	}
	if balance != 109 {
		t.Fatalf("expected final balance 109, got %d", balance)
	}

	rows, err := store.db.QueryContext(ctx, `
		SELECT type, amount, balance_after
		FROM transactions
		WHERE player_id = ?
		ORDER BY id;
	`, config.LocalPlayer)
	if err != nil {
		t.Fatalf("query transactions: %v", err)
	}
	defer rows.Close()

	var got []struct {
		typ          string
		amount       int64
		balanceAfter int64
	}
	for rows.Next() {
		var row struct {
			typ          string
			amount       int64
			balanceAfter int64
		}
		if err := rows.Scan(&row.typ, &row.amount, &row.balanceAfter); err != nil {
			t.Fatalf("scan transaction: %v", err)
		}
		got = append(got, row)
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("iterate transactions: %v", err)
	}

	want := []struct {
		typ          string
		amount       int64
		balanceAfter int64
	}{
		{typ: "credit_in", amount: 100, balanceAfter: 100},
		{typ: "spin_bet", amount: -1, balanceAfter: 99},
		{typ: "spin_win", amount: 10, balanceAfter: 109},
	}
	if len(got) != len(want) {
		t.Fatalf("expected %d transactions, got %d: %#v", len(want), len(got), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("transaction %d = %#v, want %#v", i, got[i], want[i])
		}
	}
}
