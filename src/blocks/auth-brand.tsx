import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';

export function AuthBrandPanel({
  mode = 'sign-in',
}: {
  mode?: 'sign-in' | 'sign-up';
}) {
  return (
    <aside className="maker-auth-art">
      <Link className="maker-brand" href="/">
        <img src="/logo.svg" width="38" height="38" alt="" />
        <span>{envConfigs.app_name}</span>
      </Link>
      <div>
        <h2>{m['maker.auth.title']()}</h2>
        <p>
          {mode === 'sign-up'
            ? m['maker.auth.signup_description']()
            : m['maker.auth.description']()}
        </p>
      </div>
      <figure>
        <img
          src="/imgs/generated/southparkmaker-hero.jpg"
          alt={m['maker.seo.illustration_alt']()}
          width="1254"
          height="1254"
        />
        <figcaption>{m['maker.auth.caption']()}</figcaption>
      </figure>
    </aside>
  );
}
