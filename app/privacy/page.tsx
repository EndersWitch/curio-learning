import type { Metadata } from 'next'
import SimpleNav from '@/components/SimpleNav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Curio Learning collects, uses and protects your personal information, in line with POPIA.',
}

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <SimpleNav />
      <div className="legal-wrap">
        <div className="page-eyebrow">Legal</div>
        <h1 className="page-title">Privacy Policy</h1>
        <p className="page-date">Last updated: March 2026 &nbsp;·&nbsp; Effective date: March 2026</p>

        <div className="highlight-box">
          <p>
            This Privacy Policy is governed by the <strong>Protection of Personal Information Act, 4 of 2013 (POPIA)</strong> of
            the Republic of South Africa. By using Curio Learning, you agree to the collection and use of your information as
            described in this policy.
          </p>
        </div>

        <div className="legal-content">
          <h2>1. Who We Are</h2>
          <p>Curio Learning (&quot;Curio&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an online educational platform operated in South Africa. We provide exam papers, quizzes, and AI-powered study tools to South African students from Grade R to Grade 12.</p>
          <p>
            <strong>Responsible Party (as defined by POPIA):</strong> Curio Learning<br />
            <strong>Contact:</strong> <a href="mailto:hello@curiolearning.co.za">hello@curiolearning.co.za</a><br />
            <strong>Website:</strong> curiolearning.co.za
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Information you provide to us:</h3>
          <ul>
            <li><strong>Account information</strong>: your name, email address, and grade when you register</li>
            <li><strong>Payment information</strong>: processed securely via Paystack; we do not store your card details</li>
            <li><strong>Communications</strong>: messages you send us via email or contact forms</li>
          </ul>
          <h3>Information collected automatically:</h3>
          <ul>
            <li><strong>Usage data</strong>: pages visited, quizzes taken, papers downloaded, time spent on the platform</li>
            <li><strong>Device information</strong>: browser type, operating system, screen size</li>
            <li><strong>Cookies and local storage</strong>: used to keep you logged in and remember your preferences</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use your personal information only for the following purposes:</p>
          <ul>
            <li>To create and manage your account</li>
            <li>To provide access to exam papers, quizzes, and premium features</li>
            <li>To process payments and manage your subscription</li>
            <li>To personalise your experience (e.g. showing papers for your grade)</li>
            <li>To send you important account and service notifications</li>
            <li>To improve our platform and fix technical issues</li>
            <li>To comply with legal obligations under South African law</li>
          </ul>
          <p>We will <strong>never</strong> sell your personal information to third parties.</p>

          <h2>4. Legal Basis for Processing (POPIA)</h2>
          <p>Under POPIA, we process your personal information on the following grounds:</p>
          <ul>
            <li><strong>Contract</strong>: processing is necessary to provide the services you have signed up for</li>
            <li><strong>Consent</strong>: where you have given us explicit permission (e.g. marketing emails)</li>
            <li><strong>Legitimate interest</strong>: to improve and secure our platform</li>
            <li><strong>Legal obligation</strong>: where required by South African law</li>
          </ul>

          <h2>5. Cookies</h2>
          <p>We use cookies and browser local storage to keep you logged in and remember your preferences. We also use Google AdSense, which may set its own cookies to serve relevant advertisements. You can control cookies through your browser settings, though disabling them may affect site functionality.</p>

          <h2>6. Third-Party Services</h2>
          <p>We use the following trusted third-party services that may process your data:</p>
          <ul>
            <li><strong>Supabase</strong>: database and authentication (data stored on secure servers)</li>
            <li><strong>Paystack</strong>: payment processing (PCI-DSS compliant, South Africa)</li>
            <li><strong>Google AdSense</strong>: advertising (free and non-premium users)</li>
            <li><strong>Vercel</strong>: website hosting</li>
            <li><strong>Cloudflare</strong>: DNS and security</li>
          </ul>
          <p>Each of these services has their own privacy policy. We only share the minimum data necessary for them to perform their functions.</p>

          <h2>7. Data Storage and Security</h2>
          <p>Your data is stored on secure servers provided by Supabase. We implement appropriate technical and organisational measures to protect your personal information against loss, theft, and unauthorised access. However, no system is completely secure, and we cannot guarantee absolute security.</p>

          <h2>8. Children&apos;s Privacy</h2>
          <p>Curio is designed for South African students including minors. We take children&apos;s privacy seriously. If you are under 18, you should use this platform with the knowledge of a parent or guardian. We do not knowingly collect more information from minors than is necessary to provide our educational service. Parents may contact us at <a href="mailto:hello@curiolearning.co.za">hello@curiolearning.co.za</a> to request access to or deletion of their child&apos;s data.</p>

          <h2>9. Your Rights Under POPIA</h2>
          <p>As a data subject under POPIA, you have the right to:</p>
          <ul>
            <li><strong>Access</strong>: request a copy of the personal information we hold about you</li>
            <li><strong>Correction</strong>: request that we correct inaccurate information</li>
            <li><strong>Deletion</strong>: request that we delete your personal information (subject to legal obligations)</li>
            <li><strong>Objection</strong>: object to the processing of your personal information</li>
            <li><strong>Complaint</strong>: lodge a complaint with the <strong>Information Regulator of South Africa</strong></li>
          </ul>
          <p>To exercise any of these rights, contact us at <a href="mailto:hello@curiolearning.co.za">hello@curiolearning.co.za</a>. We will respond within 30 days.</p>
          <p>
            You may also contact the Information Regulator at:<br />
            <strong>Email:</strong> inforeg@justice.gov.za<br />
            <strong>Website:</strong> <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener">www.justice.gov.za/inforeg</a>
          </p>

          <h2>10. Data Retention</h2>
          <p>We retain your personal information for as long as your account is active, or as long as necessary to provide our services. If you delete your account, we will delete or anonymise your personal data within 30 days, unless we are required to retain it for legal or financial compliance purposes.</p>

          <h2>11. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by a prominent notice on our website. Your continued use of Curio after changes are posted constitutes your acceptance of the updated policy.</p>

          <h2>12. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or how we handle your personal information, please contact us:</p>
          <p>
            <strong>Email:</strong> <a href="mailto:hello@curiolearning.co.za">hello@curiolearning.co.za</a><br />
            <strong>Website:</strong> <a href="https://curiolearning.co.za">curiolearning.co.za</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
