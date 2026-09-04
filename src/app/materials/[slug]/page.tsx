import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MaterialDocument } from "@/components/learningMaterials/MaterialDocument";
import {
  getLearningMaterial,
  learningMaterials,
} from "@/content/learningMaterials";
import css from "./page.module.css";

type MaterialPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return learningMaterials.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: MaterialPageProps): Promise<Metadata> {
  const { slug } = await params;
  const material = getLearningMaterial(slug);

  if (!material) return {};

  return {
    title: material.title,
    description: material.summary,
  };
}

export default async function MaterialPage({ params }: MaterialPageProps) {
  const { slug } = await params;
  const material = getLearningMaterial(slug);

  if (!material) notFound();

  return (
    <article className={css.page}>
      <Link href="/materials" className={css.backLink}>
        ← Усі навчальні матеріали
      </Link>

      <header className={css.header}>
        <p className={css.kicker}>Навчальний матеріал</p>
        <h1 className={css.title}>{material.title}</h1>
        <p className={css.summary}>{material.summary}</p>

        <ul className={css.topics} aria-label="Теми матеріалу">
          {material.topics.map((topic, index) => (
            <li key={topic.label}>
              <Link
                href={topic.match ? `#material-topic-${index}` : "#theory-heading"}
              >
                {topic.label}
              </Link>
            </li>
          ))}
        </ul>
      </header>

      <section className={css.theory} aria-labelledby="theory-heading">
        <h2 id="theory-heading" className={css.sectionTitle}>
          Теорія
        </h2>

        <div className={css.theoryBody}>
          <MaterialDocument
            blocks={material.blocks}
            sectionTargets={material.topics.flatMap((topic, index) =>
              topic.match
                ? [{ id: `material-topic-${index}`, match: topic.match }]
                : [],
            )}
          />
        </div>
      </section>

    </article>
  );
}
