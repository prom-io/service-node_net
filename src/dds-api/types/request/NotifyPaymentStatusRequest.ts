export interface NotifyPaymentStatusRequest {
    file_id: string,
    status: "success" | "error",
    amount: number
}
