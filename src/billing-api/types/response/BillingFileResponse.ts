export interface BillingFileResponse {
    id: string,
    name: string,
    size: number,
    file_extension: string,
    mime_type: string,
    owner: string,
    sum: string,
    buy_sum: string,
    meta_data: string,
    data_owner: string,
    keep_until?: string
}
