export function downloadCsv(rows: any[], headers: string[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const headerRow = headers.join(",");
  const dataRows = rows
    .map((row) => keys.map((k) => JSON.stringify(row[k] ?? "")).join(","))
    .join("\n");

  // Prepend UTF-8 BOM so Excel renders Arabic correctly
  const csvContent = "\uFEFF" + headerRow + "\n" + dataRows;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

