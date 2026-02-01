<template>
  <div
    id="receipt-content"
    dir="rtl"
    style="font-family:monospace;width:302px;padding:8px;font-size:13px;line-height:1.4;color:#000;"
  >
    <div style="text-align:center;font-weight:bold;font-size:17px;margin-bottom:6px;">
      إيصال شراء
    </div>

    <div style="margin-bottom:8px;">
      <div style="margin-bottom:4px;">
        <strong>رقم الفاتورة:</strong> {{ invoice?.invoice_number ?? "—" }}
      </div>
      <div style="margin-bottom:4px;">
        <strong>التاريخ:</strong> {{ formattedDate }} {{ formattedTime }}
      </div>
      <div v-if="invoice?.shop?.name" style="margin-bottom:4px;">
        <strong>المحل:</strong> {{ invoice.shop.name }}
      </div>
      <div>
        <strong>المورد:</strong> {{ invoice?.supplier_name ?? "—" }}
      </div>
    </div>

    <hr style="margin:8px 0;" />

    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="border-bottom:1px dashed #000;">
          <th style="text-align:right;">المنتج</th>
          <th style="text-align:center;">الكمية</th>
          <th style="text-align:center;">السعر</th>
          <th style="text-align:left;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, i) in items" :key="i">
          <td>{{ item.product?.name || "—" }}</td>
          <td style="text-align:center;">{{ item.quantity }}</td>
          <td style="text-align:center;">{{ fmtMoney(item.purchase_price) }}</td>
          <td style="text-align:left;">
            {{ fmtMoney(item.purchase_price * item.quantity) }}
          </td>
        </tr>
      </tbody>
    </table>

    <hr style="margin:8px 0;" />

    <div
      style="font-weight:bold;text-align:right;font-size:15px;margin-bottom:10px;"
    >
      الإجمالي: {{ fmtMoney(invoice?.total ?? 0) }} د.ع
    </div>

    <hr style="margin:10px 0;" />
    <div style="text-align:center;">
      <div style="font-size:10px;margin-top:5px;">07736657369</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { invoice } = defineProps<{
  invoice: any;
}>();

const items = Array.isArray(invoice?.items) ? invoice.items : [];

const rawDate = invoice?.purchase_date ?? null;
const rawTime = invoice?.purchase_time ?? null;

let formattedDate = "—";
let formattedTime = rawTime ?? "";

if (rawDate) {
  const tryIso = new Date(rawDate as any);
  if (!isNaN(tryIso.getTime())) {
    formattedDate = tryIso.toLocaleDateString("ar-IQ");
    if (!formattedTime) {
      formattedTime = tryIso.toLocaleTimeString("ar-IQ", { hour12: false });
    }
  } else if (typeof rawDate === "string") {
    formattedDate = (rawDate as string).split("T")[0] || "—";
  }
}

function fmtMoney(v: any) {
  const num = Number(v);
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
</script>


