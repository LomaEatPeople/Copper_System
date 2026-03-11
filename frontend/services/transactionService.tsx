import { api } from "../api/apiClient";

export const getTransactions = async () => {
  const res = await api.get("/transactions");
  return res.data;
};