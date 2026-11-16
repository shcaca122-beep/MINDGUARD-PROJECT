CREATE OR REPLACE FUNCTION public.get_curhat_aggregates(p_group_by text)
RETURNS TABLE(group_key text, total_data bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    CASE p_group_by
      WHEN 'kategori' THEN COALESCE(
        NULLIF(btrim(substring(judul_pesan FROM '^\[SEGERA\][[:space:]]*\[([^\]]+)\]')), ''),
        NULLIF(btrim(substring(judul_pesan FROM '^\[([^\]]+)\]')), ''),
        'Tanpa kategori'
      )
      WHEN 'kelas' THEN COALESCE(NULLIF(btrim(kelas), ''), 'Tanpa kelas')
      WHEN 'status' THEN COALESCE(NULLIF(btrim(status), ''), 'Tanpa status')
    END AS group_key,
    COUNT(*) AS total_data
  FROM public.layanan_siswa
  WHERE layanan = 'CURHAT'
    AND p_group_by IN ('kategori', 'kelas', 'status')
  GROUP BY 1
  ORDER BY 1;
$$;

REVOKE ALL ON FUNCTION public.get_curhat_aggregates(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_curhat_aggregates(text)
  TO authenticated;
