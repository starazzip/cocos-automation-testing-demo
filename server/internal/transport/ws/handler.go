package ws

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"

	"github.com/starazzip/cocos-automation-testing-demo/server/internal/app"
	"github.com/starazzip/cocos-automation-testing-demo/server/internal/domain"
)

type Handler struct {
	service  *app.Service
	testMode bool
}

type Envelope struct {
	ID      string          `json:"id,omitempty"`
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
	Error   *ErrorResponse  `json:"error,omitempty"`
}

type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

func NewHandler(service *app.Service, testMode bool) *Handler {
	return &Handler{
		service:  service,
		testMode: testMode,
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{"localhost:*", "127.0.0.1:*"},
	})
	if err != nil {
		return
	}
	defer conn.Close(websocket.StatusInternalError, "server closing")

	ctx := r.Context()
	for {
		_, data, err := conn.Read(ctx)
		if err != nil {
			if websocket.CloseStatus(err) == websocket.StatusNormalClosure ||
				websocket.CloseStatus(err) == websocket.StatusGoingAway {
				_ = conn.Close(websocket.StatusNormalClosure, "")
				return
			}
			_ = h.writeError(ctx, conn, "", "read_failed", "failed to read request", err.Error())
			return
		}
		var request Envelope
		if err := json.Unmarshal(data, &request); err != nil {
			_ = h.writeError(ctx, conn, "", "malformed_json", "request must be a JSON envelope", err.Error())
			return
		}
		response := h.route(ctx, request)
		if err := wsjson.Write(ctx, conn, response); err != nil {
			return
		}
	}
}

func (h *Handler) route(ctx context.Context, request Envelope) Envelope {
	if request.ID == "" {
		return errorEnvelope("", "missing_id", "request id is required", "")
	}

	switch request.Type {
	case "wallet.balance.request":
		return h.handleBalance(ctx, request.ID)
	case "wallet.credit_in.request":
		return h.handleCreditIn(ctx, request)
	case "wallet.credit_out.request":
		return h.handleCreditOut(ctx, request.ID)
	case "spin.request":
		return h.handleSpin(ctx, request)
	case "settings.request":
		return h.handleSettings(ctx, request.ID)
	case "test.force_board.request":
		return h.handleForceBoard(request)
	default:
		return errorEnvelope(request.ID, "unknown_type", "unknown message type", request.Type)
	}
}

func (h *Handler) handleBalance(ctx context.Context, id string) Envelope {
	config, err := h.service.Config(ctx)
	if err != nil {
		return domainError(id, err)
	}
	balance, err := h.service.Balance(ctx, config.LocalPlayer)
	if err != nil {
		return domainError(id, err)
	}
	return payloadEnvelope(id, "wallet.balance.result", balancePayload{Balance: balance})
}

func (h *Handler) handleCreditIn(ctx context.Context, request Envelope) Envelope {
	var payload creditInRequest
	if err := decodePayload(request.Payload, &payload); err != nil {
		return errorEnvelope(request.ID, "invalid_payload", "credit-in payload is invalid", err.Error())
	}
	config, err := h.service.Config(ctx)
	if err != nil {
		return domainError(request.ID, err)
	}
	balance, err := h.service.CreditIn(ctx, config.LocalPlayer, payload.Amount)
	if err != nil {
		return domainError(request.ID, err)
	}
	return payloadEnvelope(request.ID, "wallet.credit_in.result", balancePayload{Balance: balance})
}

func (h *Handler) handleCreditOut(ctx context.Context, id string) Envelope {
	config, err := h.service.Config(ctx)
	if err != nil {
		return domainError(id, err)
	}
	paidOut, balance, err := h.service.CreditOut(ctx, config.LocalPlayer)
	if err != nil {
		return domainError(id, err)
	}
	return payloadEnvelope(id, "wallet.credit_out.result", creditOutPayload{PaidOut: paidOut, Balance: balance})
}

func (h *Handler) handleSpin(ctx context.Context, request Envelope) Envelope {
	var payload spinRequest
	if err := decodePayload(request.Payload, &payload); err != nil {
		return errorEnvelope(request.ID, "invalid_payload", "spin payload is invalid", err.Error())
	}
	config, err := h.service.Config(ctx)
	if err != nil {
		return domainError(request.ID, err)
	}
	result, err := h.service.Spin(ctx, config.LocalPlayer, payload.Bet)
	if err != nil {
		return domainError(request.ID, err)
	}
	return payloadEnvelope(request.ID, "spin.result", spinPayload{
		SpinID:  result.SpinID,
		Board:   result.Board,
		Bet:     result.Bet,
		Win:     result.Win,
		Lines:   result.Lines,
		Balance: result.Balance,
	})
}

func (h *Handler) handleSettings(ctx context.Context, id string) Envelope {
	config, err := h.service.Config(ctx)
	if err != nil {
		return domainError(id, err)
	}
	return payloadEnvelope(id, "settings.result", settingsPayload{
		Symbols:     config.Symbols,
		BetOptions:  config.BetOptions,
		DefaultBet:  config.DefaultBet,
		CreditIn:    config.CreditIn,
		LocalPlayer: config.LocalPlayer,
	})
}

func (h *Handler) handleForceBoard(request Envelope) Envelope {
	if !h.testMode {
		return errorEnvelope(request.ID, "test_mode_required", "force board is only available in test mode", "")
	}
	var payload forceBoardRequest
	if err := decodePayload(request.Payload, &payload); err != nil {
		return errorEnvelope(request.ID, "invalid_payload", "force board payload is invalid", err.Error())
	}
	board, err := boardFromPayload(payload.Board)
	if err != nil {
		return errorEnvelope(request.ID, "invalid_board", "board must be a 3x3 symbol matrix", err.Error())
	}
	if err := h.service.ForceNextBoard(board); err != nil {
		return domainError(request.ID, err)
	}
	return payloadEnvelope(request.ID, "test.force_board.result", okPayload{OK: true})
}

func (h *Handler) writeError(ctx context.Context, conn *websocket.Conn, id, code, message, details string) error {
	return wsjson.Write(ctx, conn, errorEnvelope(id, code, message, details))
}

func decodePayload(payload json.RawMessage, target any) error {
	if len(payload) == 0 {
		return errors.New("payload is required")
	}
	return json.Unmarshal(payload, target)
}

func payloadEnvelope(id, messageType string, payload any) Envelope {
	raw, err := json.Marshal(payload)
	if err != nil {
		return errorEnvelope(id, "internal_error", "failed to encode response", err.Error())
	}
	return Envelope{
		ID:      id,
		Type:    messageType,
		Payload: raw,
	}
}

func errorEnvelope(id, code, message, details string) Envelope {
	return Envelope{
		ID:   id,
		Type: "error",
		Error: &ErrorResponse{
			Code:    code,
			Message: message,
			Details: details,
		},
	}
}

func domainError(id string, err error) Envelope {
	switch {
	case errors.Is(err, domain.ErrInvalidAmount):
		return errorEnvelope(id, "invalid_amount", "amount is invalid", "")
	case errors.Is(err, domain.ErrInvalidBet):
		return errorEnvelope(id, "invalid_bet", "bet is invalid", "")
	case errors.Is(err, domain.ErrInvalidBoard):
		return errorEnvelope(id, "invalid_board", "board is invalid", "")
	case errors.Is(err, domain.ErrInsufficientBalance):
		return errorEnvelope(id, "insufficient_balance", "balance is insufficient", "")
	default:
		return errorEnvelope(id, "internal_error", "request failed", err.Error())
	}
}

func boardFromPayload(rows [][]domain.Symbol) (domain.Board, error) {
	if len(rows) != 3 {
		return domain.Board{}, domain.ErrInvalidBoard
	}
	var board domain.Board
	for row := 0; row < 3; row++ {
		if len(rows[row]) != 3 {
			return domain.Board{}, domain.ErrInvalidBoard
		}
		for col := 0; col < 3; col++ {
			board[row][col] = rows[row][col]
		}
	}
	if err := domain.ValidateBoard(board); err != nil {
		return domain.Board{}, err
	}
	return board, nil
}

type balancePayload struct {
	Balance int64 `json:"balance"`
}

type creditInRequest struct {
	Amount int64 `json:"amount"`
}

type creditOutPayload struct {
	PaidOut int64 `json:"paidOut"`
	Balance int64 `json:"balance"`
}

type spinRequest struct {
	Bet int64 `json:"bet"`
}

type spinPayload struct {
	SpinID  int64               `json:"spinId"`
	Board   domain.Board        `json:"board"`
	Bet     int64               `json:"bet"`
	Win     int64               `json:"win"`
	Lines   []domain.PaylineWin `json:"lines"`
	Balance int64               `json:"balance"`
}

type settingsPayload struct {
	Symbols     []domain.Symbol `json:"symbols"`
	BetOptions  []int64         `json:"betOptions"`
	DefaultBet  int64           `json:"defaultBet"`
	CreditIn    int64           `json:"creditIn"`
	LocalPlayer string          `json:"localPlayer"`
}

type forceBoardRequest struct {
	Board [][]domain.Symbol `json:"board"`
}

type okPayload struct {
	OK bool `json:"ok"`
}
