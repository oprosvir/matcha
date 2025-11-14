import { AppLayout } from "@/components/layouts/AppLayout";
import { BrowseAllDataTable } from "./browse-all-data-table";
import { SuggestedDataTable } from "./suggested-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function Browse() {
  const [activeTab, setActiveTab] = useState<string>("suggested");

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex items-center justify-between flex-shrink-0">
            <Label htmlFor="view-selector" className="sr-only">
              View
            </Label>
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger
                className="flex w-fit @4xl/main:hidden"
                size="sm"
                id="view-selector"
              >
                <SelectValue placeholder="Select a view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="browse-all">Browse all</SelectItem>
                <SelectItem value="suggested">Suggested</SelectItem>
              </SelectContent>
            </Select>
            <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
              <TabsTrigger value="browse-all">Browse all</TabsTrigger>
              <TabsTrigger value="suggested">Suggested</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="browse-all"
            className="flex-1 flex flex-col min-h-0"
          >
            <BrowseAllDataTable />
          </TabsContent>
          <TabsContent
            value="suggested"
            className="flex-1 flex flex-col min-h-0"
          >
            <SuggestedDataTable />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
