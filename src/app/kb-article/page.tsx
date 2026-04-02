
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { SupabaseStatus } from '@/components/supabase-status';

export default function KBArticlePage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">KB Article</h1>
          <div className="flex items-center gap-4">
            <SupabaseStatus />
            <ThemeSwitcher />
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Understanding Risky User Behavior and How to Avoid Security Policy Violations
            </CardTitle>
            <CardDescription>
              An overview of security policies and best practices for employees.
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none text-foreground">
            <p>
              Modern organizations rely on advanced security monitoring systems to detect and respond to potential threats. These systems analyze alerts generated from security tools and evaluate whether user activities violate organizational policies. When certain actions repeatedly trigger policy violations, the associated user may be flagged as a potentially risky user.
            </p>
            <p>
              Being identified as a risky user does not always mean malicious intent. Many violations occur due to lack of awareness, negligence, or unintentional actions. Understanding how security policies work and adopting safe practices can significantly reduce the chances of triggering security alerts.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2">Why Security Policies Exist</h3>
            <p>
              Security policies are designed to protect sensitive organizational data, maintain compliance with regulations, and prevent unauthorized data exposure. These policies help ensure that information such as personal data, financial records, confidential documents, and intellectual property are handled securely.
            </p>
            <p>
              When a policy is violated, monitoring systems generate alerts that security teams investigate to determine whether the activity represents a real threat or a false alarm.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2">Common Reasons Alerts Are Triggered</h3>
            <p>
              Security alerts are commonly triggered due to activities such as:
            </p>
            <ul className="list-disc list-inside space-y-2 my-4 pl-4">
              <li>Sending sensitive information through unauthorized channels</li>
              <li>Sharing confidential documents externally without approval</li>
              <li>Accessing restricted systems or data outside normal job responsibilities</li>
              <li>Downloading or transferring large volumes of sensitive files</li>
              <li>Using personal email or cloud storage services for work data</li>
              <li>Incorrect handling of documents containing personal or financial information</li>
            </ul>
            <p>
              Many of these situations occur unintentionally when users are unaware of the organization's data protection policies.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2">How Users Can Avoid Being Flagged as Risky</h3>
            <p>
              Users can significantly reduce the risk of triggering security alerts by following good cybersecurity practices. Some recommended steps include:
            </p>
            <h4 className="text-lg font-semibold mt-4 mb-1">Understand Organizational Policies</h4>
            <p>
              Every organization has policies related to data handling, email usage, file sharing, and system access. Users should familiarize themselves with these guidelines and ensure that their daily activities comply with them.
            </p>
            <h4 className="text-lg font-semibold mt-4 mb-1">Verify Before Sharing Sensitive Information</h4>
            <p>
              Before sending documents or data externally, verify whether the content contains sensitive information such as personal identifiers, financial details, or confidential company information. If unsure, consult your security or compliance team.
            </p>
            <h4 className="text-lg font-semibold mt-4 mb-1">Use Approved Communication Channels</h4>
            <p>
              Always use official communication tools and approved platforms when sharing work-related information. Avoid sending company data through personal email accounts or unauthorized messaging services.
            </p>
            <h4 className="text-lg font-semibold mt-4 mb-1">Double-Check Recipients</h4>
            <p>
              Many security incidents occur due to accidental emails sent to the wrong recipients. Always confirm recipient addresses before sending emails containing important or sensitive information.
            </p>
            <h4 className="text-lg font-semibold mt-4 mb-1">Follow Data Classification Guidelines</h4>
            <p>
              Organizations often classify data as public, internal, confidential, or restricted. Understanding these classifications helps ensure that information is handled and shared appropriately.
            </p>
            <h4 className="text-lg font-semibold mt-4 mb-1">Report Suspicious Activity</h4>
            <p>
              If you notice unusual system behavior, unexpected alerts, or possible security incidents, report them to the IT or security team immediately. Early reporting helps prevent potential security breaches.
            </p>
            <h4 className="text-lg font-semibold mt-4 mb-1">Avoid Circumventing Security Controls</h4>
            <p>
              Security mechanisms such as encryption, access controls, and data protection tools are implemented to protect the organization. Attempting to bypass these controls can lead to serious security risks and policy violations.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2">The Role of Security Monitoring Systems</h3>
            <p>
              Security monitoring platforms continuously analyze alerts and user activity patterns. These systems help security teams identify:
            </p>
            <ul className="list-disc list-inside space-y-2 my-4 pl-4">
              <li>Repeated policy violations</li>
              <li>Suspicious user behavior</li>
              <li>Potential insider threats</li>
              <li>Emerging security risks</li>
            </ul>
            <p>
              By analyzing alert trends, organizations can improve security policies, provide better awareness training, and prevent future incidents.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2">Creating a Security-Conscious Work Environment</h3>
            <p>
              Cybersecurity is a shared responsibility across the organization. By following established policies and maintaining awareness of data protection practices, users can contribute to a safer digital environment.
            </p>
            <p>
              Responsible handling of sensitive information not only protects the organization but also ensures that users maintain a trusted and compliant security posture.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
