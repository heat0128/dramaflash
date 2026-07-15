export type LegalDocument = 'privacy' | 'terms' | 'refunds'

type LegalSection = { title: string; paragraphs: string[] }
type LegalCopy = { title: string; summary: string; sections: LegalSection[] }

export const LEGAL_EFFECTIVE_DATE = 'July 15, 2026'

export const legalCopy: Record<LegalDocument, LegalCopy> = {
  privacy: {
    title: 'Privacy Policy',
    summary:
      'This policy explains how BingeGo handles information when you use our short-drama service.',
    sections: [
      {
        title: 'Information we collect',
        paragraphs: [
          'We may collect account information such as your email address, display name, authentication identifiers, language and country preferences.',
          'We collect service activity needed to operate BingeGo, including watch history, playback position, favorites, likes, comments, device and browser information, approximate location derived from IP address, diagnostic logs, and security events.'
        ]
      },
      {
        title: 'How we use information',
        paragraphs: [
          'We use information to provide accounts and playback, remember progress, personalize language and recommendations, maintain security, prevent abuse, troubleshoot problems, measure performance, and communicate about the service.',
          'BingeGo does not currently accept payments. If paid features are introduced, this policy will be updated before payment information is collected.'
        ]
      },
      {
        title: 'Service providers and international processing',
        paragraphs: [
          'We may use infrastructure and service providers such as Supabase and Cloudflare to host databases, authenticate users, deliver media, protect the service, and process technical logs. Information may be processed in countries other than your own, subject to appropriate contractual and security safeguards.',
          'We do not sell personal information. We may disclose information when required by law, to protect users or the service, or as part of a business reorganization subject to applicable safeguards.'
        ]
      },
      {
        title: 'Retention and security',
        paragraphs: [
          'We retain information only for as long as reasonably necessary for the purposes described here, legal obligations, dispute resolution, and security. Retention periods differ by record type.',
          'We use access controls, encryption in transit, database security policies, and other reasonable safeguards. No online system can be guaranteed completely secure.'
        ]
      },
      {
        title: 'Your choices and rights',
        paragraphs: [
          'Depending on where you live, you may have rights to access, correct, delete, restrict, or receive a copy of personal information, and to object to certain processing. You may also withdraw consent where processing relies on consent.',
          'To make a privacy request, contact heatcolin@gmail.com. We may need to verify your identity before completing a request. You may also complain to your local data-protection authority.'
        ]
      },
      {
        title: 'Children and changes',
        paragraphs: [
          'BingeGo is not directed to children under 13, or a higher minimum age where required by local law. We do not knowingly collect personal information from children below the applicable age.',
          'We may update this policy as the service develops. Material changes will be communicated through the service or by another appropriate method.'
        ]
      }
    ]
  },
  terms: {
    title: 'Terms of Use',
    summary: 'These terms govern access to BingeGo. By using the service, you agree to them.',
    sections: [
      {
        title: 'Eligibility and accounts',
        paragraphs: [
          'You must be legally capable of entering into these terms and meet the minimum digital-consent age in your country. You are responsible for accurate account information, account security, and activity under your account.',
          'You may not sell, transfer, share, automate, or misuse an account, or attempt to bypass regional, access, or security controls.'
        ]
      },
      {
        title: 'Limited license and content',
        paragraphs: [
          'BingeGo grants you a personal, limited, non-exclusive, non-transferable, revocable right to access the service for lawful, non-commercial viewing.',
          'The service, software, branding, video, audio, subtitles, artwork, and other materials are owned by BingeGo or its licensors. You may not copy, download, redistribute, publicly perform, scrape, reverse engineer, or create derivative works except where law expressly permits it.'
        ]
      },
      {
        title: 'Acceptable use',
        paragraphs: [
          'Do not upload or submit unlawful, infringing, deceptive, abusive, hateful, sexually exploitative, privacy-invasive, malicious, or technically harmful material. Do not interfere with playback, security, availability, or other users.',
          'If comments or other community features are available, you remain responsible for what you submit and grant BingeGo the rights reasonably needed to host, display, moderate, and distribute that submission within the service.'
        ]
      },
      {
        title: 'Availability and early access',
        paragraphs: [
          'BingeGo is currently in early access and does not accept payments. Promotional coins, VIP labels, test access, and other benefits have no cash value, are non-transferable, and may be changed or withdrawn.',
          'We may modify, suspend, restrict, or discontinue features or content. We do not guarantee that every title, language, device feature, or territory will always be available.'
        ]
      },
      {
        title: 'Disclaimers and liability',
        paragraphs: [
          'To the extent permitted by law, the service is provided “as is” and “as available,” without implied warranties. Nothing in these terms excludes rights or liability that cannot legally be excluded.',
          'To the extent permitted by law, BingeGo is not liable for indirect, incidental, special, consequential, or punitive damages, lost profits, lost data, or interruptions arising from use of the service.'
        ]
      },
      {
        title: 'Enforcement, changes, and contact',
        paragraphs: [
          'We may investigate violations and suspend or terminate access when reasonably necessary to protect the service, users, rights holders, or comply with law. We may update these terms and will provide appropriate notice of material changes.',
          'Questions, copyright notices, and support requests may be sent to heatcolin@gmail.com. These terms do not identify a paid subscription or create a promise that paid features will launch.'
        ]
      }
    ]
  },
  refunds: {
    title: 'Refund Policy',
    summary: 'BingeGo currently has no paid checkout, paid subscription, or coin-recharge service.',
    sections: [
      {
        title: 'Current early-access service',
        paragraphs: [
          'No payment should be requested by BingeGo during the current early-access period. Promotional coins, VIP access, unlocks, and test benefits are provided without charge and cannot be redeemed for cash.',
          'Because BingeGo currently does not process purchases, there are no BingeGo charges to refund. If you see a charge claiming to be from BingeGo, contact your payment provider promptly and notify us at heatcolin@gmail.com.'
        ]
      },
      {
        title: 'Future paid services',
        paragraphs: [
          'Before any paid feature is introduced, we will publish the applicable prices, billing frequency, cancellation method, refund eligibility, payment provider, and legally required cooling-off or consumer rights.',
          'Any future purchase will be governed by the refund terms shown and accepted at checkout, together with mandatory rights in the purchaser’s country. This page will be updated before paid checkout is enabled.'
        ]
      },
      {
        title: 'Support',
        paragraphs: [
          'For account, access, or billing-related questions, contact heatcolin@gmail.com. Include the email address associated with your account, but never send passwords, full card numbers, or security codes.'
        ]
      }
    ]
  }
}
