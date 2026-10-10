// TypeScript types mirroring the tables/views defined in schema.sql
// Keep these in sync with any changes made to the SQL schema.
//
// `Database` is the source of truth (in the same shape the Supabase CLI's
// type generator produces) and the friendly `User` / `Category` / `Item` /
// `BorrowRequest` types below are derived from it via the `Tables<...>` and
// `Views<...>` helpers.

export type ItemStatus = "Available" | "Borrowed" | "Pending";
export type BorrowRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Returned";

/**
 * Database type for use with `createClient<Database>()` from
 * `@supabase/supabase-js`, giving typed `.from(...)` queries.
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: number;
          full_name: string;
          campus_email: string;
          department: string;
          created_at: string;
        };
        Insert: {
          user_id?: number;
          full_name: string;
          campus_email: string;
          department: string;
          created_at?: string;
        };
        Update: {
          user_id?: number;
          full_name?: string;
          campus_email?: string;
          department?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          category_id: number;
          category_name: string;
        };
        Insert: {
          category_id?: number;
          category_name: string;
        };
        Update: {
          category_id?: number;
          category_name?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          item_id: number;
          owner_id: number;
          title: string;
          category_id: number;
          description: string | null;
          status: ItemStatus;
          created_at: string;
        };
        Insert: {
          item_id?: number;
          owner_id: number;
          title: string;
          category_id: number;
          description?: string | null;
          status?: ItemStatus;
          created_at?: string;
        };
        Update: {
          item_id?: number;
          owner_id?: number;
          title?: string;
          category_id?: number;
          description?: string | null;
          status?: ItemStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_owner";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "fk_category";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["category_id"];
          },
        ];
      };
      borrow_requests: {
        Row: {
          request_id: number;
          item_id: number;
          borrower_id: number;
          status: BorrowRequestStatus;
          requested_at: string;
          returned_at: string | null;
          requested_return_date: string | null;
          note: string | null;
        };
        Insert: {
          request_id?: number;
          item_id: number;
          borrower_id: number;
          status?: BorrowRequestStatus;
          requested_at?: string;
          returned_at?: string | null;
          requested_return_date?: string | null;
          note?: string | null;
        };
        Update: {
          request_id?: number;
          item_id?: number;
          borrower_id?: number;
          status?: BorrowRequestStatus;
          requested_at?: string;
          returned_at?: string | null;
          requested_return_date?: string | null;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_item";
            columns: ["item_id"];
            referencedRelation: "items";
            referencedColumns: ["item_id"];
          },
          {
            foreignKeyName: "fk_borrower";
            columns: ["borrower_id"];
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: {
      active_inventory: {
        Row: {
          item_id: number;
          title: string;
          category_name: string;
          status: ItemStatus;
          owner_name: string;
          owner_email: string;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
};

// ---------------------------------------------------------------------------
// Convenience helpers + friendly type aliases for application code
// ---------------------------------------------------------------------------

export type Tables<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Update"];

export type Views<ViewName extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][ViewName]["Row"];

export type User = Tables<"users">;
export type Category = Tables<"categories">;
export type Item = Tables<"items">;
export type BorrowRequest = Tables<"borrow_requests">;

// Row shape returned by the `active_inventory` view defined in schema.sql
export type ActiveInventory = Views<"active_inventory">;

// Convenience type for an item joined with its category and owner,
// as fetched via Supabase's nested select syntax (items -> categories, users).
export type ItemWithRelations = Item & {
  categories: Pick<Category, "category_name"> | null;
  users: Pick<User, "full_name" | "campus_email"> | null;
};

// Convenience type for a borrow request joined with its item (and that
// item's owner) and borrower, as fetched via Supabase's nested select
// syntax on the "My Requests / Approvals" page.
export type BorrowRequestWithRelations = BorrowRequest & {
  items:
    | (Pick<Item, "item_id" | "title" | "status" | "owner_id"> & {
        users: Pick<User, "full_name" | "campus_email"> | null;
      })
    | null;
  users: Pick<User, "full_name" | "campus_email"> | null;
};

