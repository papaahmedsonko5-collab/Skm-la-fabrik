declare namespace App {
  interface Locals {
    /** Admin connecté (pages /admin uniquement). */
    admin?: { id: string; email: string };
    supabase?: import('@/lib/admin/supabase').AdminClient;
  }
}
