export interface PaginatedResponse<DataType> {
    count: string | number,
    data: DataType[]
}
