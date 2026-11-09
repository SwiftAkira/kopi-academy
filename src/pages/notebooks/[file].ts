// Download endpoint for practice notebooks: /notebooks/py-00.ipynb
import type { APIRoute, GetStaticPaths } from 'astro';
import { allNotebooks } from '../../lib/lesson-data';

export const getStaticPaths: GetStaticPaths = () =>
  allNotebooks().map(({ data }) => ({ params: { file: data.file }, props: { raw: data.raw } }));

export const GET: APIRoute = ({ props }) =>
  new Response(props.raw as string, {
    headers: { 'Content-Type': 'application/x-ipynb+json; charset=utf-8' },
  });
