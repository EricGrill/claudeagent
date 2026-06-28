import React from 'react';
import { format } from 'date-fns';
import type { 
  WeeklyNewsletterData, 
  ProjectRiskSnapshot, 
  ThresholdCrossing,
  RiskSignalSummary,
  RiskCategoryTrend 
} from '../types/newsletter';
import { RiskThreshold, RiskCategory, SignalSeverity } from '@prisma/client';

const COLORS = {
  primary: '#1a365d',
  secondary: '#2d3748',
  success: '#38a169',
  warning: '#d69e2e',
  danger: '#e53e3e',
  info: '#3182ce',
  light: '#f7fafc',
  border: '#e2e8f0',
  text: '#2d3748',
  muted: '#718096',
};

const THRESHOLD_COLORS: Record<RiskThreshold, string> = {
  LOW: COLORS.success,
  WATCH: '#ed8936',
  ELEVATED: COLORS.warning,
  CRITICAL: COLORS.danger,
};

const SEVERITY_COLORS: Record<SignalSeverity, string> = {
  INFO: COLORS.info,
  LOW: COLORS.success,
  MEDIUM: '#ed8936',
  HIGH: COLORS.warning,
  CRITICAL: COLORS.danger,
};

const CATEGORY_LABELS: Record<RiskCategory, string> = {
  SCHEDULE: 'Schedule',
  DESIGN: 'Design',
  COST: 'Cost',
  DISPUTE: 'Dispute',
  SAFETY: 'Safety',
  REGULATORY: 'Regulatory',
  WEATHER: 'Weather',
  SUPPLY_CHAIN: 'Supply Chain',
};

interface NewsletterEmailProps {
  data: WeeklyNewsletterData;
  unsubscribeUrl?: string;
}

export function NewsletterEmailTemplate({ data, unsubscribeUrl }: NewsletterEmailProps): React.ReactElement {
  const weekRange = `${format(data.weekStart, 'MMM d')} - ${format(data.weekEnd, 'MMM d, yyyy')}`;
  
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Construction Risk Brief - {weekRange}</title>
      </head>
      <body style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: 1.6,
        color: COLORS.text,
        backgroundColor: COLORS.light,
        margin: 0,
        padding: '20px',
      }}>
        <div style={{
          maxWidth: '680px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}>
          <Header weekRange={weekRange} tenantName={data.tenantName} />
          <div style={{ padding: '24px' }}>
            <PortfolioSummarySection summary={data.portfolioSummary} riskCounts={data.riskCounts} />
            <ProjectsToWatchSection projects={data.projectsToWatch} />
            <ThresholdCrossingsSection crossings={data.thresholdCrossings} />
            <TopRiskThemesSection themes={data.topRiskThemes} />
            <NewSignalsSection signals={data.newSignals} />
            {data.resolvedSignals.length > 0 && (
              <ResolvedSignalsSection signals={data.resolvedSignals} />
            )}
          </div>
          <Footer 
            generatedAt={data.generatedAt} 
            unsubscribeUrl={unsubscribeUrl} 
          />
        </div>
      </body>
    </html>
  );
}

function Header({ weekRange, tenantName }: { weekRange: string; tenantName: string }): React.ReactElement {
  return (
    <div style={{
      backgroundColor: COLORS.primary,
      color: '#ffffff',
      padding: '32px 24px',
      textAlign: 'center' as const,
    }}>
      <div style={{ fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '8px' }}>
        ClaimZero
      </div>
      <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 600 }}>
        Construction Risk Brief
      </h1>
      <div style={{ fontSize: '16px', opacity: 0.9 }}>
        {weekRange}
      </div>
      <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '4px' }}>
        {tenantName}
      </div>
    </div>
  );
}

function PortfolioSummarySection({ 
  summary, 
  riskCounts 
}: { 
  summary: WeeklyNewsletterData['portfolioSummary']; 
  riskCounts: WeeklyNewsletterData['riskCounts'];
}): React.ReactElement {
  const trendIcon = summary.trend === 'improving' ? '↓' : summary.trend === 'worsening' ? '↑' : '→';
  const trendColor = summary.trend === 'improving' ? COLORS.success : summary.trend === 'worsening' ? COLORS.danger : COLORS.muted;
  
  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ 
        fontSize: '18px', 
        fontWeight: 600, 
        color: COLORS.primary, 
        borderBottom: `2px solid ${COLORS.border}`,
        paddingBottom: '8px',
        marginBottom: '16px',
      }}>
        Portfolio Overview
      </h2>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap' as const, 
        gap: '16px',
        marginBottom: '20px',
      }}>
        <StatCard 
          label="Average Risk Score" 
          value={summary.averageRiskScore.toFixed(1)} 
          sublabel={`${summary.scoreDelta >= 0 ? '+' : ''}${summary.scoreDelta.toFixed(1)} from last week`}
          color={trendColor}
        />
        <StatCard 
          label="Active Projects" 
          value={summary.activeProjects.toString()} 
          sublabel={`of ${summary.totalProjects} total`}
        />
        <StatCard 
          label="Trend" 
          value={`${trendIcon} ${summary.trend.charAt(0).toUpperCase() + summary.trend.slice(1)}`} 
          color={trendColor}
        />
      </div>

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap' as const, 
        gap: '12px',
      }}>
        <CountBadge label="Critical" count={riskCounts.critical} color={COLORS.danger} />
        <CountBadge label="Watch" count={riskCounts.watch} color="#ed8936" />
        <CountBadge label="New Signals" count={riskCounts.new} color={COLORS.info} />
        <CountBadge label="Resolved" count={riskCounts.resolved} color={COLORS.success} />
      </div>
    </section>
  );
}

function StatCard({ 
  label, 
  value, 
  sublabel, 
  color = COLORS.text 
}: { 
  label: string; 
  value: string; 
  sublabel?: string; 
  color?: string;
}): React.ReactElement {
  return (
    <div style={{
      flex: '1 1 180px',
      padding: '16px',
      backgroundColor: COLORS.light,
      borderRadius: '6px',
      border: `1px solid ${COLORS.border}`,
    }}>
      <div style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 600, color }}>
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: '12px', color: COLORS.muted, marginTop: '4px' }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

function CountBadge({ 
  label, 
  count, 
  color 
}: { 
  label: string; 
  count: number; 
  color: string;
}): React.ReactElement {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: `${color}15`,
      borderRadius: '20px',
      border: `1px solid ${color}30`,
    }}>
      <span style={{ 
        width: '24px', 
        height: '24px', 
        borderRadius: '50%', 
        backgroundColor: color, 
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 600,
      }}>
        {count}
      </span>
      <span style={{ fontSize: '13px', color: COLORS.text }}>
        {label}
      </span>
    </div>
  );
}

function ProjectsToWatchSection({ projects }: { projects: ProjectRiskSnapshot[] }): React.ReactElement {
  if (projects.length === 0) {
    return (
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 600, 
          color: COLORS.primary,
          borderBottom: `2px solid ${COLORS.border}`,
          paddingBottom: '8px',
          marginBottom: '16px',
        }}>
          Projects to Watch
        </h2>
        <p style={{ color: COLORS.muted, fontStyle: 'italic' }}>
          No critical or elevated projects this week.
        </p>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ 
        fontSize: '18px', 
        fontWeight: 600, 
        color: COLORS.primary,
        borderBottom: `2px solid ${COLORS.border}`,
        paddingBottom: '8px',
        marginBottom: '16px',
      }}>
        Projects to Watch
      </h2>
      
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse' as const,
        fontSize: '14px',
      }}>
        <thead>
          <tr style={{ backgroundColor: COLORS.light }}>
            <th style={{ padding: '10px', textAlign: 'left' as const, borderBottom: `1px solid ${COLORS.border}` }}>Project</th>
            <th style={{ padding: '10px', textAlign: 'center' as const, borderBottom: `1px solid ${COLORS.border}` }}>Score</th>
            <th style={{ padding: '10px', textAlign: 'center' as const, borderBottom: `1px solid ${COLORS.border}` }}>Change</th>
            <th style={{ padding: '10px', textAlign: 'center' as const, borderBottom: `1px solid ${COLORS.border}` }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.projectId}>
              <td style={{ padding: '10px', borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ fontWeight: 500 }}>{project.projectName}</div>
                {project.location && (
                  <div style={{ fontSize: '12px', color: COLORS.muted }}>{project.location}</div>
                )}
              </td>
              <td style={{ padding: '10px', textAlign: 'center' as const, borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ 
                  fontWeight: 600, 
                  color: THRESHOLD_COLORS[project.threshold] 
                }}>
                  {project.currentScore.toFixed(0)}
                </span>
              </td>
              <td style={{ padding: '10px', textAlign: 'center' as const, borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ 
                  color: project.scoreDelta > 0 ? COLORS.danger : project.scoreDelta < 0 ? COLORS.success : COLORS.muted 
                }}>
                  {project.scoreDelta > 0 ? '+' : ''}{project.scoreDelta.toFixed(1)}
                </span>
              </td>
              <td style={{ padding: '10px', textAlign: 'center' as const, borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: `${THRESHOLD_COLORS[project.threshold]}20`,
                  color: THRESHOLD_COLORS[project.threshold],
                }}>
                  {project.threshold}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ThresholdCrossingsSection({ crossings }: { crossings: ThresholdCrossing[] }): React.ReactElement {
  if (crossings.length === 0) {
    return <></>;
  }

  const escalations = crossings.filter(c => c.direction === 'escalated');
  const deescalations = crossings.filter(c => c.direction === 'deescalated');

  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ 
        fontSize: '18px', 
        fontWeight: 600, 
        color: COLORS.primary,
        borderBottom: `2px solid ${COLORS.border}`,
        paddingBottom: '8px',
        marginBottom: '16px',
      }}>
        Threshold Changes
      </h2>

      {escalations.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: COLORS.danger, marginBottom: '8px' }}>
            Escalated ({escalations.length})
          </h3>
          {escalations.map((crossing) => (
            <div key={crossing.projectId} style={{
              padding: '12px',
              backgroundColor: `${COLORS.danger}10`,
              borderLeft: `3px solid ${COLORS.danger}`,
              borderRadius: '0 4px 4px 0',
              marginBottom: '8px',
            }}>
              <div style={{ fontWeight: 500 }}>{crossing.projectName}</div>
              <div style={{ fontSize: '13px', color: COLORS.muted }}>
                {crossing.previousThreshold} → {crossing.currentThreshold} (Score: {crossing.currentScore.toFixed(0)})
              </div>
            </div>
          ))}
        </div>
      )}

      {deescalations.length > 0 && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: COLORS.success, marginBottom: '8px' }}>
            De-escalated ({deescalations.length})
          </h3>
          {deescalations.map((crossing) => (
            <div key={crossing.projectId} style={{
              padding: '12px',
              backgroundColor: `${COLORS.success}10`,
              borderLeft: `3px solid ${COLORS.success}`,
              borderRadius: '0 4px 4px 0',
              marginBottom: '8px',
            }}>
              <div style={{ fontWeight: 500 }}>{crossing.projectName}</div>
              <div style={{ fontSize: '13px', color: COLORS.muted }}>
                {crossing.previousThreshold} → {crossing.currentThreshold} (Score: {crossing.currentScore.toFixed(0)})
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TopRiskThemesSection({ themes }: { themes: RiskCategoryTrend[] }): React.ReactElement {
  if (themes.length === 0) {
    return <></>;
  }

  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ 
        fontSize: '18px', 
        fontWeight: 600, 
        color: COLORS.primary,
        borderBottom: `2px solid ${COLORS.border}`,
        paddingBottom: '8px',
        marginBottom: '16px',
      }}>
        Top Risk Themes
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '16px' }}>
        {themes.slice(0, 4).map((theme) => (
          <div key={theme.category} style={{
            flex: '1 1 calc(50% - 8px)',
            minWidth: '200px',
            padding: '16px',
            backgroundColor: COLORS.light,
            borderRadius: '6px',
            border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: COLORS.primary,
              marginBottom: '8px',
            }}>
              {CATEGORY_LABELS[theme.category]}
            </div>
            <div style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '8px' }}>
              {theme.projectCount} project{theme.projectCount !== 1 ? 's' : ''} affected
            </div>
            <div style={{ fontSize: '13px' }}>
              {theme.topProjects.slice(0, 3).map((p, i) => (
                <div key={p.projectId} style={{ 
                  paddingLeft: '8px', 
                  borderLeft: `2px solid ${COLORS.border}`,
                  marginBottom: '4px',
                }}>
                  {p.projectName}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NewSignalsSection({ signals }: { signals: RiskSignalSummary[] }): React.ReactElement {
  if (signals.length === 0) {
    return (
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 600, 
          color: COLORS.primary,
          borderBottom: `2px solid ${COLORS.border}`,
          paddingBottom: '8px',
          marginBottom: '16px',
        }}>
          New Risk Signals
        </h2>
        <p style={{ color: COLORS.muted, fontStyle: 'italic' }}>
          No new risk signals detected this week.
        </p>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ 
        fontSize: '18px', 
        fontWeight: 600, 
        color: COLORS.primary,
        borderBottom: `2px solid ${COLORS.border}`,
        paddingBottom: '8px',
        marginBottom: '16px',
      }}>
        New Risk Signals ({signals.length})
      </h2>

      {signals.slice(0, 10).map((signal) => (
        <div key={signal.signalId} style={{
          padding: '12px',
          backgroundColor: COLORS.light,
          borderLeft: `3px solid ${SEVERITY_COLORS[signal.severity]}`,
          borderRadius: '0 4px 4px 0',
          marginBottom: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: `${SEVERITY_COLORS[signal.severity]}20`,
              color: SEVERITY_COLORS[signal.severity],
            }}>
              {signal.severity}
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: COLORS.border,
              color: COLORS.muted,
            }}>
              {CATEGORY_LABELS[signal.category]}
            </span>
          </div>
          <div style={{ fontWeight: 500, marginBottom: '2px' }}>{signal.title}</div>
          <div style={{ fontSize: '13px', color: COLORS.muted }}>
            {signal.projectName} • {format(signal.detectedAt, 'MMM d')}
          </div>
        </div>
      ))}

      {signals.length > 10 && (
        <p style={{ fontSize: '13px', color: COLORS.muted, textAlign: 'center' as const }}>
          + {signals.length - 10} more signals
        </p>
      )}
    </section>
  );
}

function ResolvedSignalsSection({ signals }: { signals: RiskSignalSummary[] }): React.ReactElement {
  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ 
        fontSize: '18px', 
        fontWeight: 600, 
        color: COLORS.success,
        borderBottom: `2px solid ${COLORS.border}`,
        paddingBottom: '8px',
        marginBottom: '16px',
      }}>
        Resolved This Week ({signals.length})
      </h2>

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap' as const, 
        gap: '8px',
      }}>
        {signals.slice(0, 8).map((signal) => (
          <div key={signal.signalId} style={{
            padding: '8px 12px',
            backgroundColor: `${COLORS.success}10`,
            borderRadius: '4px',
            fontSize: '13px',
          }}>
            <span style={{ textDecoration: 'line-through', color: COLORS.muted }}>
              {signal.title}
            </span>
            <span style={{ color: COLORS.muted }}> • {signal.projectName}</span>
          </div>
        ))}
      </div>

      {signals.length > 8 && (
        <p style={{ fontSize: '13px', color: COLORS.muted, marginTop: '8px' }}>
          + {signals.length - 8} more resolved
        </p>
      )}
    </section>
  );
}

function Footer({ 
  generatedAt, 
  unsubscribeUrl 
}: { 
  generatedAt: Date; 
  unsubscribeUrl?: string;
}): React.ReactElement {
  return (
    <div style={{
      backgroundColor: COLORS.light,
      padding: '24px',
      textAlign: 'center' as const,
      borderTop: `1px solid ${COLORS.border}`,
    }}>
      <div style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '8px' }}>
        Generated on {format(generatedAt, 'MMMM d, yyyy \'at\' h:mm a')}
      </div>
      <div style={{ fontSize: '12px', color: COLORS.muted }}>
        ClaimZero - Construction Risk Intelligence
      </div>
      {unsubscribeUrl && (
        <div style={{ marginTop: '12px' }}>
          <a 
            href={unsubscribeUrl} 
            style={{ 
              fontSize: '12px', 
              color: COLORS.muted, 
              textDecoration: 'underline',
            }}
          >
            Unsubscribe from this newsletter
          </a>
        </div>
      )}
    </div>
  );
}

export function renderNewsletterToHtml(data: WeeklyNewsletterData, unsubscribeUrl?: string): string {
  const ReactDOMServer = require('react-dom/server');
  return ReactDOMServer.renderToStaticMarkup(
    <NewsletterEmailTemplate data={data} unsubscribeUrl={unsubscribeUrl} />
  );
}
