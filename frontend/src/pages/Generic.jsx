import Layout from '../components/Layout';

export default function Generic({
  title,
  subtitle = 'This workspace module is ready for your operational data.',
}) {
  return (
    <Layout>
      <div className="card p-12 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-black">
          {title}
        </h1>

        <p className="text-slate-500 mt-3">
          {subtitle}
        </p>
      </div>
    </Layout>
  );
}