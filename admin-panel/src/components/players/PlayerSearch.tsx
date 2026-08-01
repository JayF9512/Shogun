"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Search bar for player lookup by username / email / player id. */
export function PlayerSearch({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
      className="flex w-full max-w-md items-center gap-2"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by username, email or player ID…"
          className="pl-9"
        />
      </div>
      <Button type="submit">Search</Button>
    </form>
  );
}
