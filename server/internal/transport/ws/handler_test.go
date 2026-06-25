package ws

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"

	"github.com/starazzip/cocos-automation-testing-demo/server/internal/app"
	"github.com/starazzip/cocos-automation-testing-demo/server/internal/domain"
	"github.com/starazzip/cocos-automation-testing-demo/server/internal/store/sqlite"
)

func TestHandlerRoutesCreditInAndSpin(t *testing.T) {
	service, cleanup := newTestService(t)
	defer cleanup()

	server := httptest.NewServer(NewHandler(service, false))
	defer server.Close()

	ctx := context.Background()
	conn, closeConn := dialTestServer(t, ctx, server.URL)
	defer closeConn()

	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "credit-1",
		Type: "wallet.credit_in.request",
		Payload: mustJSON(t, creditInRequest{
			Amount: 100,
		}),
	})
	response := readEnvelope(t, ctx, conn)
	if response.ID != "credit-1" || response.Type != "wallet.credit_in.result" {
		t.Fatalf("unexpected credit-in response: %#v", response)
	}
	var credit balancePayload
	unmarshalPayload(t, response, &credit)
	if credit.Balance != 100 {
		t.Fatalf("expected balance 100, got %d", credit.Balance)
	}

	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "spin-1",
		Type: "spin.request",
		Payload: mustJSON(t, spinRequest{
			Bet: 1,
		}),
	})
	response = readEnvelope(t, ctx, conn)
	if response.ID != "spin-1" || response.Type != "spin.result" {
		t.Fatalf("unexpected spin response: %#v", response)
	}
	var spin spinPayload
	unmarshalPayload(t, response, &spin)
	if spin.Bet != 1 {
		t.Fatalf("expected bet 1, got %d", spin.Bet)
	}
	if err := domain.ValidateBoard(spin.Board); err != nil {
		t.Fatalf("spin board should be valid: %v", err)
	}
}

func TestHandlerRoutesBalanceCreditOutAndSettings(t *testing.T) {
	service, cleanup := newTestService(t)
	defer cleanup()

	server := httptest.NewServer(NewHandler(service, false))
	defer server.Close()

	ctx := context.Background()
	conn, closeConn := dialTestServer(t, ctx, server.URL)
	defer closeConn()

	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "credit-1",
		Type: "wallet.credit_in.request",
		Payload: mustJSON(t, creditInRequest{
			Amount: 100,
		}),
	})
	_ = readEnvelope(t, ctx, conn)

	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "balance-1",
		Type: "wallet.balance.request",
	})
	response := readEnvelope(t, ctx, conn)
	if response.ID != "balance-1" || response.Type != "wallet.balance.result" {
		t.Fatalf("unexpected balance response: %#v", response)
	}
	var balance balancePayload
	unmarshalPayload(t, response, &balance)
	if balance.Balance != 100 {
		t.Fatalf("expected balance 100, got %d", balance.Balance)
	}

	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "settings-1",
		Type: "settings.request",
	})
	response = readEnvelope(t, ctx, conn)
	if response.ID != "settings-1" || response.Type != "settings.result" {
		t.Fatalf("unexpected settings response: %#v", response)
	}
	var settings settingsPayload
	unmarshalPayload(t, response, &settings)
	if len(settings.BetOptions) != 3 || settings.DefaultBet != 1 || settings.CreditIn != 100 {
		t.Fatalf("unexpected settings payload: %#v", settings)
	}
	var rawSettings map[string]json.RawMessage
	unmarshalPayload(t, response, &rawSettings)
	if _, ok := rawSettings["reels"]; ok {
		t.Fatalf("settings response must not expose reels: %s", response.Payload)
	}
	if _, ok := rawSettings["payTable"]; ok {
		t.Fatalf("settings response must not expose payTable: %s", response.Payload)
	}

	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "credit-out-1",
		Type: "wallet.credit_out.request",
	})
	response = readEnvelope(t, ctx, conn)
	if response.ID != "credit-out-1" || response.Type != "wallet.credit_out.result" {
		t.Fatalf("unexpected credit-out response: %#v", response)
	}
	var creditOut creditOutPayload
	unmarshalPayload(t, response, &creditOut)
	if creditOut.PaidOut != 100 || creditOut.Balance != 0 {
		t.Fatalf("expected paidOut 100 and balance 0, got %#v", creditOut)
	}
}

func TestHandlerReturnsStructuredErrors(t *testing.T) {
	service, cleanup := newTestService(t)
	defer cleanup()

	server := httptest.NewServer(NewHandler(service, false))
	defer server.Close()

	ctx := context.Background()
	conn, closeConn := dialTestServer(t, ctx, server.URL)
	defer closeConn()

	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "unknown-1",
		Type: "unknown.request",
	})
	response := readEnvelope(t, ctx, conn)
	assertError(t, response, "unknown-1", "unknown_type")

	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "spin-bad",
		Type: "spin.request",
		Payload: mustJSON(t, spinRequest{
			Bet: 99,
		}),
	})
	response = readEnvelope(t, ctx, conn)
	assertError(t, response, "spin-bad", "invalid_bet")

	writeEnvelope(t, ctx, conn, Envelope{
		Type: "wallet.balance.request",
	})
	response = readEnvelope(t, ctx, conn)
	assertError(t, response, "", "missing_id")
}

func TestHandlerRejectsMalformedJSON(t *testing.T) {
	service, cleanup := newTestService(t)
	defer cleanup()

	server := httptest.NewServer(NewHandler(service, false))
	defer server.Close()

	ctx := context.Background()
	conn, closeConn := dialTestServer(t, ctx, server.URL)
	defer closeConn()

	if err := conn.Write(ctx, websocket.MessageText, []byte(`{"id":"bad","type":`)); err != nil {
		t.Fatalf("write malformed json: %v", err)
	}
	response := readEnvelope(t, ctx, conn)
	assertError(t, response, "", "malformed_json")
}

func TestForceBoardRequiresTestMode(t *testing.T) {
	service, cleanup := newTestService(t)
	defer cleanup()

	server := httptest.NewServer(NewHandler(service, false))
	defer server.Close()

	ctx := context.Background()
	conn, closeConn := dialTestServer(t, ctx, server.URL)
	defer closeConn()

	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "force-1",
		Type: "test.force_board.request",
		Payload: mustJSON(t, forceBoardRequest{
			Board: [][]domain.Symbol{
				{"A", "A", "A"},
				{"K", "Q", "K"},
				{"7", "7", "7"},
			},
		}),
	})
	response := readEnvelope(t, ctx, conn)
	assertError(t, response, "force-1", "test_mode_required")
}

func TestForceBoardInTestModeControlsNextSpin(t *testing.T) {
	service, cleanup := newTestService(t)
	defer cleanup()

	server := httptest.NewServer(NewHandler(service, true))
	defer server.Close()

	ctx := context.Background()
	conn, closeConn := dialTestServer(t, ctx, server.URL)
	defer closeConn()

	forced := domain.Board{
		{"A", "A", "A"},
		{"K", "Q", "K"},
		{"7", "7", "7"},
	}
	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "force-1",
		Type: "test.force_board.request",
		Payload: mustJSON(t, forceBoardRequest{
			Board: [][]domain.Symbol{
				{forced[0][0], forced[0][1], forced[0][2]},
				{forced[1][0], forced[1][1], forced[1][2]},
				{forced[2][0], forced[2][1], forced[2][2]},
			},
		}),
	})
	response := readEnvelope(t, ctx, conn)
	if response.ID != "force-1" || response.Type != "test.force_board.result" {
		t.Fatalf("unexpected force board response: %#v", response)
	}

	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "credit-1",
		Type: "wallet.credit_in.request",
		Payload: mustJSON(t, creditInRequest{
			Amount: 100,
		}),
	})
	_ = readEnvelope(t, ctx, conn)

	writeEnvelope(t, ctx, conn, Envelope{
		ID:   "spin-1",
		Type: "spin.request",
		Payload: mustJSON(t, spinRequest{
			Bet: 1,
		}),
	})
	response = readEnvelope(t, ctx, conn)
	var spin spinPayload
	unmarshalPayload(t, response, &spin)
	if spin.Board != forced {
		t.Fatalf("expected forced board %#v, got %#v", forced, spin.Board)
	}
	if spin.Win != 30 || spin.Balance != 129 {
		t.Fatalf("expected win 30 balance 129, got win %d balance %d", spin.Win, spin.Balance)
	}
}

func newTestService(t *testing.T) (*app.Service, func()) {
	t.Helper()

	store, err := sqlite.Open(filepath.Join(t.TempDir(), "slot.db"))
	if err != nil {
		t.Fatalf("open sqlite store: %v", err)
	}
	service := app.NewService(store)
	if err := service.Init(context.Background(), domain.DefaultConfig()); err != nil {
		t.Fatalf("init service: %v", err)
	}
	return service, func() {
		_ = store.Close()
	}
}

func dialTestServer(t *testing.T, ctx context.Context, url string) (*websocket.Conn, func()) {
	t.Helper()

	wsURL := "ws" + strings.TrimPrefix(url, "http")
	conn, _, err := websocket.Dial(ctx, wsURL, nil)
	if err != nil {
		t.Fatalf("dial websocket: %v", err)
	}
	return conn, func() {
		_ = conn.Close(websocket.StatusNormalClosure, "")
	}
}

func writeEnvelope(t *testing.T, ctx context.Context, conn *websocket.Conn, envelope Envelope) {
	t.Helper()

	if err := wsjson.Write(ctx, conn, envelope); err != nil {
		t.Fatalf("write envelope: %v", err)
	}
}

func readEnvelope(t *testing.T, ctx context.Context, conn *websocket.Conn) Envelope {
	t.Helper()

	var response Envelope
	if err := wsjson.Read(ctx, conn, &response); err != nil {
		t.Fatalf("read envelope: %v", err)
	}
	return response
}

func mustJSON(t *testing.T, value any) json.RawMessage {
	t.Helper()

	data, err := json.Marshal(value)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}
	return data
}

func unmarshalPayload(t *testing.T, envelope Envelope, target any) {
	t.Helper()

	if err := json.Unmarshal(envelope.Payload, target); err != nil {
		t.Fatalf("unmarshal payload: %v", err)
	}
}

func assertError(t *testing.T, response Envelope, id string, code string) {
	t.Helper()

	if response.ID != id || response.Type != "error" || response.Error == nil {
		t.Fatalf("unexpected error response: %#v", response)
	}
	if response.Error.Code != code {
		t.Fatalf("expected error code %q, got %q", code, response.Error.Code)
	}
}
