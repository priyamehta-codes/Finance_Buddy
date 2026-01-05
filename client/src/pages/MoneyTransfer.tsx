import { Layout } from "@/components/layout/Layout";
import { MonthlyMoneyFlow } from "@/components/dashboard/MonthlyMoneyFlow";

export default function MoneyTransfer() {
  return (
    <Layout title="Monthly Money Flow">
      <MonthlyMoneyFlow />
    </Layout>
  );
}
