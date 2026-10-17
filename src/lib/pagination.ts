export async function collectPages<T>(
  getPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  size = 500,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await getPage(from, from + size - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < size) return rows;
  }
}
