export function exportCSV(name: string, rows: unknown[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((v) => {
          let value = String(v ?? "");
          if (/^[\s]*[=+\-@]/.test(value)) value = "'" + value;
          return '"' + value.replace(/"/g, '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
