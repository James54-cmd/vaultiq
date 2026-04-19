"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Download } from "lucide-react";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type CSVRow = {
  Date: string;
  Description: string;
  Amount: string;
  Direction: "income" | "expense" | "transfer";
  Category?: string;
  BankName?: string;
  ReferenceNumber?: string;
};

type CSVImportFlowProps = {
  onImport: (rows: CSVRow[]) => Promise<void>;
};

export function CSVImportFlow({ onImport }: CSVImportFlowProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "success">("upload");
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Validate headers roughly
        const data = results.data;
        if (data.length > 0) {
          const firstRow = data[0];
          if (!firstRow.Date || !firstRow.Amount || !firstRow.Description || !firstRow.Direction) {
            setError("Invalid CSV format. Required headers: Date, Description, Amount, Direction");
            return;
          }
          setParsedData(data);
          setStep("preview");
          setError(null);
        } else {
          setError("The CSV file is empty.");
        }
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        processFile(file);
      } else {
        setError("Please drop a valid CSV file.");
      }
      e.dataTransfer.clearData();
    }
  };

  const handleImport = async () => {
    setStep("importing");
    setError(null);
    try {
      await onImport(parsedData);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import transactions.");
      setStep("preview");
    }
  };

  const handleDownloadSample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const headers = ["Date", "Description", "Amount", "Direction", "BankName", "Category", "ReferenceNumber"];
    const rows = [
      ["2024-04-01", "Tech Corp Salary", "50000.00", "income", "UnionBank", "salary", "REF-001"],
      ["2024-04-02", "Supermarket Groceries", "3500.00", "expense", "Metrobank", "food", "REF-002"],
      ["2024-04-05", "Electric Bill", "2400.00", "expense", "GCash", "utilities", "REF-003"],
      ["2024-04-10", "Transport Ride", "350.00", "expense", "GCash", "transport", ""],
      ["2024-04-15", "Freelance Design", "15000.00", "income", "UnionBank", "freelance", "INV-1024"],
    ];
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "vaultiq_sample_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setStep("upload");
    setParsedData([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setTimeout(reset, 300);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-dashed border-secondary text-secondary hover:bg-secondary/10">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border-border bg-surface-raised p-0 text-foreground">
        <div className="border-b border-border px-6 py-5">
          <DialogTitle className="text-xl font-semibold tracking-tightest text-foreground">
            Import Transactions
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted">
            Upload a CSV statement to bulk import transactions.
          </DialogDescription>
        </div>

        <div className="p-6 relative min-h-[300px]">
          <AnimatePresence mode="wait">
            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full space-y-4"
              >
                <div
                  className={cn(
                    "flex flex-col items-center justify-center h-[200px] rounded-xl border-2 border-dashed transition-colors cursor-pointer",
                    isDragging ? "border-primary bg-primary/10" : "border-border bg-background/50 hover:bg-surface"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="rounded-full bg-secondary/10 p-4 mb-4 transition-transform hover:scale-110">
                    <FileSpreadsheet className={cn("h-8 w-8 text-secondary", isDragging && "animate-bounce")} />
                  </div>
                  <p className="text-sm font-medium text-foreground">Click or drag CSV here</p>
                  <p className="text-xs text-muted mt-1 px-4 text-center">Make sure your file matches the required template format.</p>

                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-secondary/30 bg-secondary/10 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Need a starting point?</p>
                    <p className="pt-0.5 text-xs text-muted">Download our sample template with correct headers.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSample}
                    className="shrink-0 gap-2 border-secondary/40 bg-surface text-secondary hover:bg-secondary/10 hover:text-secondary shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    Sample CSV
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Previewing {parsedData.length} transactions</p>
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </div>

                <div className="rounded-md border border-border overflow-hidden max-h-[300px] overflow-y-auto bg-surface">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-background text-muted sticky top-0 shadow-sm z-10">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Ref No.</th>
                        <th className="px-4 py-3 font-medium">Direction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedData.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-background/50">
                          <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">{row.Date}</td>
                          <td className="px-4 py-3 font-medium text-sm truncate max-w-[150px]" title={row.Description}>{row.Description}</td>
                          <td className="px-4 py-3 text-sm">{row.Amount}</td>
                          <td className="px-4 py-3 text-xs text-muted truncate max-w-[100px]">{row.ReferenceNumber || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold",
                              row.Direction === "income" ? "bg-primary/20 text-primary" : "bg-error/20 text-error"
                            )}>
                              {row.Direction}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {parsedData.length > 10 && (
                        <tr>
                          <td colSpan={5} className="text-center text-xs text-muted py-4">
                            + {parsedData.length - 10} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleImport} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Import {parsedData.length} Records
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "importing" && (
              <motion.div
                key="importing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[250px] space-y-4"
              >
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
                <p className="text-sm text-muted animate-pulse">Importing transactions...</p>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-[250px] space-y-4"
              >
                <div className="rounded-full bg-primary/20 p-4 text-primary">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">Import Complete!</p>
                  <p className="text-sm text-muted mt-1">Successfully added {parsedData.length} transactions.</p>
                </div>
                <Button onClick={() => setOpen(false)} variant="secondary" className="mt-4">
                  Close
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-6 right-6 rounded-md bg-error/10 p-3 flex items-start gap-3 border border-error/20"
            >
              <AlertCircle className="h-5 w-5 text-error shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
