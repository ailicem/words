CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"cover_url" text,
	"book_id" text NOT NULL,
	"tags" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "books_book_id_unique" UNIQUE("book_id")
);
--> statement-breakpoint
CREATE TABLE "words" (
	"id" bigint PRIMARY KEY NOT NULL,
	"wordRank" integer,
	"headWord" text,
	"content" json,
	"bookId" text
);
