import {
  materialSourceBlocks,
  type MaterialContentBlock,
} from "./sourceBlocks";

type MaterialDetails = {
  title: string;
  sourceFile: string;
  summary: string;
  topics: MaterialTopic[];
};

export type MaterialTopic = {
  label: string;
  match?: string;
};

export type LearningMaterial = {
  slug: string;
  title: string;
  sourceFile: string;
  summary: string;
  topics: MaterialTopic[];
  blocks: MaterialContentBlock[];
};

const materialOrder = [
  "algebra-graphs",
  "algebra-7",
  "algebra-8-complex",
  "algebra-8-fractions",
  "algebra-9",
  "algebra-10",
  "geometry-7",
  "circle-and-angles",
  "math-7-algorithms",
] as const;

const details: Record<string, MaterialDetails> = {
  "algebra-graphs": {
    title: "Алгебра. Графіки функцій",
    sourceFile: "07.Алгебра_Графіки_задачі.docx",
    summary: "Побудова графіків лінійних функцій за заданими формулами.",
    topics: [{ label: "Алгебра" }, { label: "Графіки функцій" }],
  },
  "algebra-7": {
    title: "Алгебра 7 клас",
    sourceFile:
      "Алгебра_7_клас_Математичні_вирази_Рівняння_Ступені_Текстові_задачі.docx",
    summary:
      "Основні правила для виразів, рівнянь, степенів і текстових задач.",
    topics: [
      { label: "Математичні вирази", match: "6. Математичні вирази" },
      { label: "Рівняння", match: "8. Рівняння" },
      { label: "Ступені та корені", match: "10. Ступені та корені" },
      { label: "Текстові задачі", match: "12. Текстові задачі" },
    ],
  },
  "algebra-8-complex": {
    title: "Алгебра 8 клас. Складні питання",
    sourceFile:
      "Алгебра_8_Складні_питання_2_Арифметичні_дії_6_Математичні_вирази.docx",
    summary:
      "Правила арифметичних дій і перетворення математичних виразів.",
    topics: [
      { label: "Складні питання" },
      { label: "Арифметичні дії", match: "2. Арифметичні дії" },
      { label: "Математичні вирази", match: "6. Математичні вирази" },
    ],
  },
  "algebra-8-fractions": {
    title: "Алгебра 8 клас. Дроби, рівняння, ступені та корені",
    sourceFile:
      "Алгебра_8_клас_–_5_Дроби_8_Рівняння_10_Ступені_та_корені.docx",
    summary:
      "Дії з дробами, рівняння, властивості степенів і квадратних коренів.",
    topics: [
      { label: "Дроби", match: "5. Дроби" },
      { label: "Рівняння", match: "8. Рівняння" },
      { label: "Ступені та корені", match: "10. Ступені та корені" },
    ],
  },
  "algebra-9": {
    title: "Алгебра 9 клас",
    sourceFile:
      "Алгебра_9_клас_–_4_Рівності_та_нерівності_14_Функції_21_Комбінаторика.docx",
    summary:
      "Нерівності, функції, прогресії, комбінаторика та основи ймовірності.",
    topics: [
      { label: "Рівності та нерівності", match: "4. Рівності та нерівності" },
      { label: "Функції", match: "14. Функції" },
      { label: "Комбінаторика", match: "21. Комбінаторика" },
    ],
  },
  "algebra-10": {
    title: "Алгебра 10 клас",
    sourceFile:
      "Алгебра_10_клас_–_4_Рівності_та_нерівності_14_Функції_21_Комбінаторика.docx",
    summary:
      "Множини, властивості функцій, многочлени та математична індукція.",
    topics: [
      { label: "Множини", match: "Операції над множинами" },
      { label: "Функції", match: "14. Функції" },
      { label: "Многочлени", match: "Ділення многочленів" },
      { label: "Математична індукція", match: "Метод математичної індукції" },
    ],
  },
  "geometry-7": {
    title: "Геометрія 7 клас",
    sourceFile:
      "Геометрія_7_клас_послідовно_–_3_Елементарна_планіметрія_7_Обрахункова.docx",
    summary:
      "Основні геометричні об’єкти, кути, трикутники та властивості кола.",
    topics: [
      { label: "Елементарна планіметрія", match: "3. Елементарна планіметрія" },
      { label: "Обрахункова геометрія", match: "7. Обрахункова геометрія" },
    ],
  },
  "circle-and-angles": {
    title: "Коло та кути",
    sourceFile: "Коло_та_кути_7_Обрахункова_геометрія.docx",
    summary: "Центральні й вписані кути, дуги, хорди та дотичні.",
    topics: [
      { label: "Коло", match: "Центральний кут кола" },
      { label: "Кути", match: "Вписаний кут" },
      { label: "Обрахункова геометрія", match: "7. Обрахункова геометрія" },
    ],
  },
  "math-7-algorithms": {
    title: "Математика 7 клас",
    sourceFile:
      "Математика_7_Алгоритми_вирішення_задач_7_Рівняння_12_Текстові_задачі.docx",
    summary:
      "Покрокові алгоритми для рівнянь, систем і текстових задач.",
    topics: [
      { label: "Алгоритми", match: "Алгоритм №1" },
      { label: "Рівняння", match: "7. Рівняння" },
      { label: "Текстові задачі", match: "12. Текстові задачі" },
    ],
  },
};

export const learningMaterials: LearningMaterial[] = materialOrder.map(
  (slug) => {
    const materialDetails = details[slug];

    if (!materialDetails) {
      throw new Error(`Missing learning material details: ${slug}`);
    }

    return {
      slug,
      ...materialDetails,
      blocks: materialSourceBlocks[slug] ?? [],
    };
  },
);

export function getLearningMaterial(slug: string): LearningMaterial | undefined {
  return learningMaterials.find((material) => material.slug === slug);
}
