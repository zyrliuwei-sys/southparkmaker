import { createFileRoute } from '@tanstack/react-router';

import { makerSeo } from '@/lib/maker-seo';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import {
  MakerCharacterGuide,
  MakerExportGuide,
  MakerUseCases,
} from '@/blocks/maker-editorial';
import {
  MakerCreationPaths,
  MakerCTA,
  MakerFAQ,
  MakerGallery,
  MakerHeroBlock,
  MakerHowItWorks,
} from '@/blocks/maker-home';
import { PhotoComparisons } from '@/blocks/photo-comparisons';
import { Pricing } from '@/blocks/pricing';

export const Route = createFileRoute('/')({
  head: () => makerSeo('/'),
  component: HomePage,
});
function HomePage() {
  return (
    <div className="maker-page">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <MakerHeroBlock />
        <PhotoComparisons />
        <MakerCreationPaths />
        <MakerGallery />
        <MakerHowItWorks />
        <MakerCharacterGuide />
        <MakerUseCases />
        <MakerExportGuide />
        <Pricing />
        <MakerFAQ />
        <MakerCTA />
      </main>
      <Footer />
    </div>
  );
}
