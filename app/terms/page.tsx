import type { Metadata } from 'next'
import SimpleNav from '@/components/SimpleNav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing your use of Curio Learning.',
}

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <SimpleNav />
      <div className="legal-wrap">
        <div className="page-eyebrow">Legal</div>
        <h1 className="page-title">Terms of Service</h1>
        <p className="page-date">Last updated: March 2026 &nbsp;·&nbsp; Effective date: March 2026</p>

        <div className="highlight-box terms">
          <p>
            These Terms of Service constitute a legally binding agreement between you and Curio Learning, governed by the
            laws of the <strong>Republic of South Africa</strong>. Please read them carefully before using our platform.
          </p>
        </div>

        <div className="legal-content terms">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using curiolearning.co.za (&quot;the Platform&quot;), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not use the Platform. If you are under 18, your parent or legal guardian must agree to these terms on your behalf.</p>

          <h2>2. About Curio</h2>
          <p>Curio Learning is an educational platform providing South African students with exam papers, AI-powered quizzes, study resources, and related educational tools. We operate under South African law and our content is aligned with the Curriculum and Assessment Policy Statement (CAPS).</p>

          <h2>3. Account Registration</h2>
          <p>To access certain features, you must create an account. You agree to:</p>
          <ul>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Keep your password secure and not share it with others</li>
            <li>Notify us immediately of any unauthorised use of your account</li>
            <li>Be responsible for all activity that occurs under your account</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>

          <h2>4. Free and Premium Services</h2>
          <h3>Free tier:</h3>
          <p>Exam papers and memoranda are available to all users free of charge, with no account required. We are committed to keeping this free forever.</p>
          <h3>Premium tier:</h3>
          <p>Premium features (AI-powered quizzes, Deep Learn explanations, custom test generators, and progress tracking) require a paid subscription. Premium subscriptions are billed monthly at the rate displayed on our pricing page. A 7-day free trial is available for new subscribers.</p>

          <h2>5. Payment and Billing</h2>
          <p>Payments are processed securely by <strong>Paystack</strong>, a PCI-DSS compliant payment provider operating in South Africa. All prices are in <strong>South African Rand (ZAR)</strong> and include VAT where applicable.</p>
          <ul>
            <li>Subscriptions auto-renew monthly unless cancelled</li>
            <li>You may cancel your subscription at any time from your account settings</li>
            <li>Cancellation takes effect at the end of your current billing period</li>
            <li>Refunds are considered on a case-by-case basis. Contact us at <a href="mailto:hello@curiolearning.co.za">hello@curiolearning.co.za</a></li>
          </ul>

          <h2>6. Acceptable Use</h2>
          <p>You agree not to use the Platform to:</p>
          <ul>
            <li>Share, resell, or distribute our content without written permission</li>
            <li>Attempt to access other users&apos; accounts or private data</li>
            <li>Use automated tools, bots, or scrapers to extract content</li>
            <li>Upload or transmit harmful, illegal, or offensive content</li>
            <li>Impersonate another person or entity</li>
            <li>Violate any applicable South African law, including the Electronic Communications and Transactions Act (ECT Act) and POPIA</li>
          </ul>

          <h2>7. Intellectual Property</h2>
          <p>All content on the Platform, including exam papers, questions, explanations, designs, logos, and software, is the intellectual property of Curio Learning or its licensors and is protected under South African copyright law.</p>
          <p>You are granted a personal, non-transferable, non-exclusive licence to access and use our content for your own educational purposes only. You may not copy, reproduce, distribute, or create derivative works from our content without our express written permission.</p>

          <h2>8. Content Disclaimer</h2>
          <p>Curio Learning provides educational content to help students prepare for examinations. While we strive for accuracy and curriculum alignment, our content:</p>
          <ul>
            <li>Is not officially endorsed by the Department of Basic Education or any examination body</li>
            <li>Should be used as a supplementary study resource, not a substitute for school instruction</li>
            <li>May contain errors. Please report any inaccuracies to <a href="mailto:hello@curiolearning.co.za">hello@curiolearning.co.za</a></li>
          </ul>

          <h2>9. Advertising</h2>
          <p>Free and non-premium users may see advertisements served by Google AdSense. Premium subscribers do not see advertisements. We do not control the content of third-party advertisements and are not responsible for them.</p>

          <h2>10. Limitation of Liability</h2>
          <p>To the maximum extent permitted by South African law, Curio Learning shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to loss of data, loss of exam performance, or loss of profits.</p>
          <p>Our total liability to you for any claim arising from these terms shall not exceed the amount you paid to us in the 3 months preceding the claim.</p>

          <h2>11. Termination</h2>
          <p>We may suspend or terminate your access to the Platform at any time, with or without notice, if you breach these Terms of Service. You may also delete your account at any time. Upon termination, your right to use the Platform ceases immediately.</p>

          <h2>12. Governing Law and Disputes</h2>
          <p>These Terms of Service are governed by and construed in accordance with the laws of the <strong>Republic of South Africa</strong>. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the South African courts.</p>
          <p>We encourage you to contact us first to resolve any dispute informally at <a href="mailto:hello@curiolearning.co.za">hello@curiolearning.co.za</a>.</p>

          <h2>13. Changes to These Terms</h2>
          <p>We may update these Terms of Service from time to time. We will notify you of material changes by email or by a prominent notice on our website. Your continued use of the Platform after changes are posted constitutes your acceptance of the updated terms.</p>

          <h2>14. Contact</h2>
          <p>
            For questions about these Terms of Service:<br />
            <strong>Email:</strong> <a href="mailto:hello@curiolearning.co.za">hello@curiolearning.co.za</a><br />
            <strong>Website:</strong> <a href="https://curiolearning.co.za">curiolearning.co.za</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
