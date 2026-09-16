import {sqliteTable,integer,text} from 'drizzle-orm/sqlite-core';
export const catalogCache=sqliteTable('catalog_cache',{
  id:integer('id').primaryKey(),payload:text('payload').notNull(),queue:text('queue'),
  lockUntil:integer('lock_until').notNull().default(0),lockToken:text('lock_token'),
  retryAfter:integer('retry_after').notNull().default(0),error:text('error')
});
