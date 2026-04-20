/**
 * Mock article data for the Open Access Journal Search portal.
 *
 * This file is the single swap-out point for real API integration.
 * Replace `mockArticles` with an async fetch from your chosen API
 * (e.g. CORE, OpenAlex, Unpaywall, EuropePMC) and update the
 * `searchArticles` function in `src/lib/search.ts` accordingly.
 */

export interface Article {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi: string | null;
  sourceUrl: string;
  source: string;
  license: string | null;
  language: string;
  abstract?: string;
}

export const mockArticles: Article[] = [
  {
    id: "1",
    title: "Machine Learning Approaches to Genomic Data Analysis: A Systematic Review",
    authors: ["Chen, L.", "Rodriguez, M.", "Patel, S.", "Kim, J."],
    journal: "PLOS Computational Biology",
    year: 2023,
    doi: "10.1371/journal.pcbi.1011234",
    sourceUrl: "https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1011234",
    source: "PLOS ONE",
    license: "CC BY 4.0",
    language: "English",
    abstract: "We systematically review machine learning methods applied to large-scale genomic datasets, covering supervised, unsupervised, and deep learning paradigms with emphasis on reproducibility and interpretability."
  },
  {
    id: "2",
    title: "Climate Change Impacts on Coastal Wetland Ecosystems in the Pacific Northwest",
    authors: ["Thompson, R.", "Nakamura, Y.", "Osei, A."],
    journal: "Nature Climate Change",
    year: 2022,
    doi: "10.1038/s41558-022-01421-0",
    sourceUrl: "https://www.nature.com/articles/s41558-022-01421-0",
    source: "PubMed Central",
    license: "CC BY-NC 4.0",
    language: "English",
    abstract: "This study quantifies the projected loss of tidal marshes and estuarine habitats under RCP 4.5 and 8.5 emissions scenarios, identifying critical zones for prioritized conservation."
  },
  {
    id: "3",
    title: "Quantum Error Correction Codes for Near-Term Devices",
    authors: ["Volkov, I.", "Abramowitz, D."],
    journal: "Physical Review Letters",
    year: 2023,
    doi: "10.1103/PhysRevLett.130.180501",
    sourceUrl: "https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.130.180501",
    source: "arXiv",
    license: "CC BY 4.0",
    language: "English",
    abstract: "We present a family of fault-tolerant stabilizer codes optimized for hardware with limited qubit connectivity, achieving a threshold error rate of 1.2% under depolarizing noise."
  },
  {
    id: "4",
    title: "Socioeconomic Determinants of Health Disparities in Urban Pediatric Populations",
    authors: ["Williams, T.", "Hernandez, C.", "Adeyemi, O.", "Liu, W.", "Gomez, E."],
    journal: "JAMA Pediatrics",
    year: 2022,
    doi: "10.1001/jamapediatrics.2022.3891",
    sourceUrl: "https://jamanetwork.com/journals/jamapediatrics/fullarticle/2796291",
    source: "PubMed Central",
    license: "CC BY 4.0",
    language: "English",
    abstract: "Cross-sectional analysis of 45,000 pediatric encounters across 12 metropolitan hospitals reveals that neighborhood poverty index explains 38% of variance in acute care outcomes independent of insurance status."
  },
  {
    id: "5",
    title: "Large Language Models as Automated Scientific Reviewers: Capabilities and Limitations",
    authors: ["Park, S.", "Müller, H.", "Benali, F."],
    journal: "arXiv preprint",
    year: 2024,
    doi: "10.48550/arXiv.2401.09234",
    sourceUrl: "https://arxiv.org/abs/2401.09234",
    source: "arXiv",
    license: "CC BY 4.0",
    language: "English",
    abstract: "We benchmark GPT-4, Claude 3, and open-weight alternatives against expert human reviewers on 1,200 manuscript evaluations across five disciplines, finding high correlation on technical accuracy but low alignment on novelty assessment."
  },
  {
    id: "6",
    title: "Biodiversidad y Funciones Ecosistémicas en Bosques Tropicales Fragmentados",
    authors: ["Vargas, A.", "Santos, M.", "Ferreira, R."],
    journal: "Biotropica",
    year: 2022,
    doi: "10.1111/btp.13112",
    sourceUrl: "https://onlinelibrary.wiley.com/doi/10.1111/btp.13112",
    source: "CORE",
    license: "CC BY 4.0",
    language: "Spanish",
    abstract: "Analizamos la relación entre fragmentación del hábitat y diversidad funcional en 35 parcelas del Amazonas brasileño, encontrando umbrales críticos de conectividad para el mantenimiento de servicios ecosistémicos."
  },
  {
    id: "7",
    title: "Epigenetic Regulation of Stress Response Pathways in Chronic Disease",
    authors: ["Ahmed, K.", "Johansson, P.", "Okonkwo, C."],
    journal: "Cell Reports",
    year: 2023,
    doi: "10.1016/j.celrep.2023.112456",
    sourceUrl: "https://www.cell.com/cell-reports/fulltext/S2211-1247(23)00456-7",
    source: "PubMed Central",
    license: "CC BY-NC-ND 4.0",
    language: "English",
    abstract: "DNA methylation profiling of 5,000 patients reveals a conserved epigenetic signature across type 2 diabetes, cardiovascular disease, and depression, suggesting shared upstream regulators."
  },
  {
    id: "8",
    title: "Reinforcement Learning for Robot Navigation in Unstructured Environments",
    authors: ["Tanaka, H.", "Srivastava, P."],
    journal: "IEEE Transactions on Robotics",
    year: 2023,
    doi: "10.1109/TRO.2023.3259034",
    sourceUrl: "https://ieeexplore.ieee.org/document/10078942",
    source: "arXiv",
    license: null,
    language: "English",
    abstract: "We propose a curriculum-based deep RL framework enabling legged robots to generalize across terrain types unseen during training, reducing collision rates by 61% compared to model-predictive baselines."
  },
  {
    id: "9",
    title: "Antibiotics Resistance Patterns in Hospital-Acquired Infections: A Multi-Center Study",
    authors: ["Boateng, E.", "Ivanova, N.", "Torres, J.", "Huang, Q."],
    journal: "The Lancet Infectious Diseases",
    year: 2022,
    doi: "10.1016/S1473-3099(22)00423-9",
    sourceUrl: "https://www.thelancet.com/journals/laninf/article/PIIS1473-3099(22)00423-9/fulltext",
    source: "EuropePMC",
    license: "CC BY 4.0",
    language: "English",
    abstract: "Retrospective cohort study across 18 hospitals in six countries documents the emergence of pan-resistant Klebsiella pneumoniae strains and proposes a novel risk stratification framework."
  },
  {
    id: "10",
    title: "Digital Humanities and Computational Approaches to Medieval Manuscript Analysis",
    authors: ["Fischer, K.", "Nguyen, T."],
    journal: "Digital Scholarship in the Humanities",
    year: 2023,
    doi: "10.1093/llc/fqad012",
    sourceUrl: "https://academic.oup.com/dsh/article/38/2/456/7080432",
    source: "CORE",
    license: "CC BY 4.0",
    language: "English",
    abstract: "We apply convolutional neural networks and handwriting recognition models to digitized manuscripts from the 9th–12th centuries, enabling automated scribal hand attribution at 93% accuracy."
  },
  {
    id: "11",
    title: "Nanotechnology Applications in Targeted Drug Delivery Systems",
    authors: ["Pham, L.", "Goldstein, E.", "Al-Rashid, M."],
    journal: "ACS Nano",
    year: 2023,
    doi: "10.1021/acsnano.3c02891",
    sourceUrl: "https://pubs.acs.org/doi/10.1021/acsnano.3c02891",
    source: "PubMed Central",
    license: "CC BY 4.0",
    language: "English",
    abstract: "Lipid nanoparticle formulations conjugated with tumor-targeting peptides demonstrate 12-fold improved intracellular delivery of siRNA payloads in murine glioblastoma models compared to unconjugated controls."
  },
  {
    id: "12",
    title: "Intégration des Énergies Renouvelables dans les Réseaux Électriques Intelligents",
    authors: ["Dupont, C.", "Lefevre, M.", "Bakr, O."],
    journal: "Revue de l'Énergie",
    year: 2022,
    doi: null,
    sourceUrl: "https://www.revue-energie.com/articles/2022/integrations-energies-renouvelables",
    source: "CORE",
    license: "CC BY-SA 4.0",
    language: "French",
    abstract: "Analyse des défis d'intégration des sources d'énergie variable (éolienne et solaire) dans les réseaux de distribution européens, avec modélisation des besoins de stockage à l'horizon 2035."
  },
  {
    id: "13",
    title: "Long-Term Cognitive Outcomes Following Mild Traumatic Brain Injury in Children",
    authors: ["McKenzie, A.", "Reyes-Castro, I.", "Dubois, P."],
    journal: "Pediatric Neurology",
    year: 2023,
    doi: "10.1016/j.pediatrneurol.2023.03.014",
    sourceUrl: "https://www.pedneur.com/article/S0887-8994(23)00056-0/fulltext",
    source: "PubMed Central",
    license: "CC BY-NC 4.0",
    language: "English",
    abstract: "5-year follow-up of 842 children with sport-related concussions identifies persistent executive function deficits in 23% of cases and establishes baseline neuroimaging predictors."
  },
  {
    id: "14",
    title: "Supply Chain Resilience and Disruption Management in Post-Pandemic Economies",
    authors: ["Okafor, N.", "Zhang, Y.", "Svensson, L."],
    journal: "International Journal of Operations & Production Management",
    year: 2023,
    doi: "10.1108/IJOPM-07-2022-0455",
    sourceUrl: "https://www.emerald.com/insight/content/doi/10.1108/IJOPM-07-2022-0455",
    source: "CORE",
    license: "CC BY 4.0",
    language: "English",
    abstract: "Mixed-methods study of 230 manufacturing firms identifies digital twin adoption, dual sourcing, and regional inventory buffering as the three highest-impact resilience investments post-COVID-19."
  },
  {
    id: "15",
    title: "CRISPR-Based Diagnostics for Rapid Pathogen Detection in Low-Resource Settings",
    authors: ["Sato, R.", "Mahlako, K.", "Bhattacharya, S."],
    journal: "Nature Biomedical Engineering",
    year: 2024,
    doi: "10.1038/s41551-023-01152-x",
    sourceUrl: "https://www.nature.com/articles/s41551-023-01152-x",
    source: "PubMed Central",
    license: "CC BY 4.0",
    language: "English",
    abstract: "We report a SHERLOCK-based lateral flow assay achieving 98.4% sensitivity and 99.1% specificity for 12 common pathogens using equipment-free sample preparation compatible with field deployment."
  }
];

/**
 * Available filter options derived from mock data.
 * In a real integration, these could be fetched from the API
 * as facet aggregations.
 */
export const SOURCES = ["All", "PLOS ONE", "PubMed Central", "arXiv", "CORE", "EuropePMC"];

export const LANGUAGES = ["All", "English", "Spanish", "French", "German", "Portuguese"];

export const LICENSES = ["All", "CC BY 4.0", "CC BY-NC 4.0", "CC BY-NC-ND 4.0", "CC BY-SA 4.0"];

export const YEAR_MIN = 2020;
export const YEAR_MAX = 2024;
