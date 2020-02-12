export interface NotifyPaymentStatusResponse {
    file_id: string,
    status: "success" | "error",
    amount: number
}
