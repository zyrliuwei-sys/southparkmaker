import { useState } from 'react';
import { ArrowRight, Check, LoaderCircle } from 'lucide-react';

export type MakerPricePlan = {
  id: string;
  name: string;
  description: string;
  price: string;
  interval: string;
  credits: string;
  generations: string;
  expiry: string;
  action: string;
  features: string[];
  featured: boolean;
};
export type MakerPriceGroup = {
  id: string;
  label: string;
  note: string;
  plans: MakerPricePlan[];
};
export function MakerPricing({
  title,
  description,
  groups,
  costNote,
  freeNote,
  heading = 'h2',
  busyId,
  onChoose,
  labels,
}: {
  title: string;
  description: string;
  groups: MakerPriceGroup[];
  costNote: string;
  freeNote: string;
  heading?: 'h1' | 'h2';
  busyId?: string;
  onChoose: (id: string) => void;
  labels: { tabs: string; recommended: string; loading: string };
}) {
  const [selected, setSelected] = useState(0);
  const group = groups[selected];
  const Heading = heading;
  return (
    <section id="pricing" className="maker-section maker-pricing-section">
      <div className="maker-container">
        <div className="maker-pricing-intro">
          <Heading>{title}</Heading>
          <p>{description}</p>
        </div>
        <div
          className="maker-price-switch"
          role="tablist"
          aria-label={labels.tabs}
        >
          {groups.map((g, index) => (
            <button
              type="button"
              key={g.id}
              role="tab"
              id={`price-tab-${g.id}`}
              aria-selected={selected === index}
              aria-controls="price-panel"
              tabIndex={selected === index ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => {
                if (
                  !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                    event.key
                  )
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? groups.length - 1
                      : (selected + 1) % groups.length;
                setSelected(next);
                event.currentTarget.parentElement
                  ?.querySelectorAll<HTMLButtonElement>('[role=tab]')
                  [next]?.focus();
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
        <p className="maker-price-group-note">{group.note}</p>
        <div
          id="price-panel"
          role="tabpanel"
          aria-labelledby={`price-tab-${group.id}`}
          className="maker-price-grid"
        >
          {group.plans.map((plan) => (
            <article
              key={plan.id}
              className={`maker-price-card${plan.featured ? 'is-featured' : ''}`}
            >
              <div className="maker-price-card-top">
                <h3>{plan.name}</h3>
                {plan.featured && <span>{labels.recommended}</span>}
              </div>
              <p className="maker-price-description">{plan.description}</p>
              <div className="maker-price-amount">
                <strong>{plan.price}</strong>
                <span>{plan.interval}</span>
              </div>
              <p className="maker-price-credits">{plan.credits}</p>
              <p className="maker-price-generations">{plan.generations}</p>
              <button
                type="button"
                className={`maker-button ${plan.featured ? 'maker-button-primary' : 'maker-button-outline'}`}
                disabled={!!busyId}
                onClick={() => onChoose(plan.id)}
              >
                {busyId === plan.id ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    {labels.loading}
                  </>
                ) : (
                  <>
                    {plan.action}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="maker-price-expiry">{plan.expiry}</p>
            </article>
          ))}
        </div>
        <div className="maker-price-footnote">
          <p>{costNote}</p>
          <p>{freeNote}</p>
        </div>
      </div>
    </section>
  );
}
