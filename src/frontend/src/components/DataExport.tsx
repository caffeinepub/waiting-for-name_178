import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useExportHabitData } from "@/hooks/useQueries";
import type { Habit } from "@/backend.d";

export function DataExport() {
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("csv");
  const exportData = useExportHabitData();

  const handleExport = async () => {
    try {
      const data = await exportData.mutateAsync();
      
      if (exportFormat === "json") {
        exportAsJSON(data);
      } else {
        exportAsCSV(data);
      }
      
      toast.success(`Data exported as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data. Please try again.");
    }
  };

  const exportAsJSON = (data: Array<[Habit, bigint[]]>) => {
    const formatted = data.map(([habit, completionDates]) => ({
      id: habit.id.toString(),
      name: habit.name,
      description: habit.description || null,
      category: habit.category || null,
      targetFrequency: Number(habit.targetFrequency),
      streakCount: Number(habit.streakCount),
      soundEnabled: habit.soundEnabled,
      reminderTime: habit.reminderTime ? Number(habit.reminderTime) : null,
      createdAt: new Date(Number(habit.createdAt) / 1_000_000).toISOString(),
      lastUpdated: new Date(Number(habit.lastUpdated) / 1_000_000).toISOString(),
      completions: completionDates.map(d => new Date(Number(d) / 1_000_000).toISOString()),
      totalCompletions: completionDates.length,
    }));

    const json = JSON.stringify(formatted, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    downloadFile(blob, `streakmaster-export-${Date.now()}.json`);
  };

  const exportAsCSV = (data: Array<[Habit, bigint[]]>) => {
    const headers = [
      "Habit ID",
      "Name",
      "Description",
      "Category",
      "Target Frequency",
      "Current Streak",
      "Total Completions",
      "Sound Enabled",
      "Reminder Time",
      "Created At",
      "Last Updated",
    ];

    const rows = data.map(([habit, completionDates]) => [
      habit.id.toString(),
      habit.name,
      habit.description || "",
      habit.category || "",
      habit.targetFrequency.toString(),
      habit.streakCount.toString(),
      completionDates.length.toString(),
      habit.soundEnabled ? "Yes" : "No",
      habit.reminderTime ? new Date(Number(habit.reminderTime)).toLocaleTimeString() : "",
      new Date(Number(habit.createdAt) / 1_000_000).toISOString(),
      new Date(Number(habit.lastUpdated) / 1_000_000).toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    downloadFile(blob, `streakmaster-export-${Date.now()}.csv`);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Your Data</CardTitle>
        <CardDescription>
          Download all your habit data and completion history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button
            variant={exportFormat === "csv" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setExportFormat("csv")}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant={exportFormat === "json" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setExportFormat("json")}
          >
            <FileJson className="mr-2 h-4 w-4" />
            JSON
          </Button>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleExport}
          disabled={exportData.isPending}
        >
          {exportData.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Export as {exportFormat.toUpperCase()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
