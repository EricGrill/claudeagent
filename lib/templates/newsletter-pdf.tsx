import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { 
  WeeklyNewsletterData, 
  ProjectRiskSnapshot,
  RiskSignalSummary,
  RiskCategoryTrend 
} from '../types/newsletter';
import { RiskThreshold, RiskCategory } from '@prisma/client';

const colors = {
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

const thresholdColors: Record<RiskThreshold, string> = {
  LOW: colors.success,
  WATCH: '#ed8936',
  ELEVATED: colors.warning,
  CRITICAL: colors.danger,
};

const categoryLabels: Record<RiskCategory, string> = {
  SCHEDULE: 'Schedule',
  DESIGN: 'Design',
  COST: 'Cost',
  DISPUTE: 'Dispute',
  SAFETY: 'Safety',
  REGULATORY: 'Regulatory',
  WEATHER: 'Weather',
  SUPPLY_CHAIN: 'Supply Chain',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.text,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 15,
  },
  logo: {
    fontSize: 8,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  tenantName: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 10,
    backgroundColor: colors.light,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 8,
    color: colors.muted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statSublabel: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 2,
  },
  countsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  countNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  countLabel: {
    fontSize: 9,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.light,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontSize: 9,
  },
  projectCell: {
    flex: 2,
  },
  scoreCell: {
    width: 50,
    textAlign: 'center',
  },
  changeCell: {
    width: 50,
    textAlign: 'center',
  },
  statusCell: {
    width: 60,
    textAlign: 'center',
  },
  thresholdBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    fontSize: 8,
    textAlign: 'center',
  },
  crossingItem: {
    padding: 8,
    marginBottom: 6,
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  crossingTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  crossingDetail: {
    fontSize: 9,
    color: colors.muted,
  },
  themeCard: {
    padding: 10,
    backgroundColor: colors.light,
    borderRadius: 4,
    marginBottom: 8,
  },
  themeTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  themeCount: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 6,
  },
  themeProject: {
    fontSize: 9,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    marginBottom: 3,
  },
  signalItem: {
    padding: 8,
    marginBottom: 6,
    backgroundColor: colors.light,
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  signalHeader: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  signalBadge: {
    fontSize: 7,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  signalTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  signalDetail: {
    fontSize: 9,
    color: colors.muted,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: colors.muted,
  },
  pageNumber: {
    fontSize: 8,
    color: colors.muted,
  },
  emptyText: {
    fontSize: 10,
    color: colors.muted,
    fontStyle: 'italic',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeGridItem: {
    width: '48%',
  },
});

export interface NewsletterPDFProps {
  data: WeeklyNewsletterData;
}

export function NewsletterPDF({ data }: NewsletterPDFProps) {
  const weekRange = `${format(data.weekStart, 'MMM d')} - ${format(data.weekEnd, 'MMM d, yyyy')}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header weekRange={weekRange} tenantName={data.tenantName} />
        <PortfolioSummary summary={data.portfolioSummary} riskCounts={data.riskCounts} />
        <ProjectsToWatch projects={data.projectsToWatch} />
        <Footer generatedAt={data.generatedAt} pageNumber={1} />
      </Page>

      {(data.thresholdCrossings.length > 0 || data.topRiskThemes.length > 0) && (
        <Page size="A4" style={styles.page}>
          <ThresholdCrossings crossings={data.thresholdCrossings} />
          <TopRiskThemes themes={data.topRiskThemes} />
          <Footer generatedAt={data.generatedAt} pageNumber={2} />
        </Page>
      )}

      {data.newSignals.length > 0 && (
        <Page size="A4" style={styles.page}>
          <NewSignals signals={data.newSignals} />
          {data.resolvedSignals.length > 0 && (
            <ResolvedSignals signals={data.resolvedSignals} />
          )}
          <Footer generatedAt={data.generatedAt} pageNumber={3} />
        </Page>
      )}
    </Document>
  );
}

function Header({ weekRange, tenantName }: { weekRange: string; tenantName: string }): React.ReactElement {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>CLAIMZERO</Text>
      <Text style={styles.title}>Construction Risk Brief</Text>
      <Text style={styles.subtitle}>{weekRange}</Text>
      <Text style={styles.tenantName}>{tenantName}</Text>
    </View>
  );
}

function PortfolioSummary({ 
  summary, 
  riskCounts 
}: { 
  summary: WeeklyNewsletterData['portfolioSummary']; 
  riskCounts: WeeklyNewsletterData['riskCounts'];
}): React.ReactElement {
  const trendIcon = summary.trend === 'improving' ? '↓' : summary.trend === 'worsening' ? '↑' : '→';
  const trendColor = summary.trend === 'improving' ? colors.success : summary.trend === 'worsening' ? colors.danger : colors.muted;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Portfolio Overview</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Average Risk Score</Text>
          <Text style={[styles.statValue, { color: trendColor }]}>
            {summary.averageRiskScore.toFixed(1)}
          </Text>
          <Text style={styles.statSublabel}>
            {summary.scoreDelta >= 0 ? '+' : ''}{summary.scoreDelta.toFixed(1)} from last week
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Projects</Text>
          <Text style={styles.statValue}>{summary.activeProjects}</Text>
          <Text style={styles.statSublabel}>of {summary.totalProjects} total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Trend</Text>
          <Text style={[styles.statValue, { color: trendColor }]}>
            {trendIcon} {summary.trend.charAt(0).toUpperCase() + summary.trend.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.countsRow}>
        <View style={[styles.countBadge, { backgroundColor: `${colors.danger}20` }]}>
          <Text style={[styles.countNumber, { backgroundColor: colors.danger }]}>
            {riskCounts.critical}
          </Text>
          <Text style={styles.countLabel}>Critical</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: '#ed893620' }]}>
          <Text style={[styles.countNumber, { backgroundColor: '#ed8936' }]}>
            {riskCounts.watch}
          </Text>
          <Text style={styles.countLabel}>Watch</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: `${colors.info}20` }]}>
          <Text style={[styles.countNumber, { backgroundColor: colors.info }]}>
            {riskCounts.new}
          </Text>
          <Text style={styles.countLabel}>New Signals</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: `${colors.success}20` }]}>
          <Text style={[styles.countNumber, { backgroundColor: colors.success }]}>
            {riskCounts.resolved}
          </Text>
          <Text style={styles.countLabel}>Resolved</Text>
        </View>
      </View>
    </View>
  );
}

function ProjectsToWatch({ projects }: { projects: ProjectRiskSnapshot[] }): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Projects to Watch</Text>
      
      {projects.length === 0 ? (
        <Text style={styles.emptyText}>No critical or elevated projects this week.</Text>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.projectCell, { fontWeight: 'bold' }]}>Project</Text>
            <Text style={[styles.tableCell, styles.scoreCell, { fontWeight: 'bold' }]}>Score</Text>
            <Text style={[styles.tableCell, styles.changeCell, { fontWeight: 'bold' }]}>Change</Text>
            <Text style={[styles.tableCell, styles.statusCell, { fontWeight: 'bold' }]}>Status</Text>
          </View>
          {projects.slice(0, 15).map((project) => (
            <View key={project.projectId} style={styles.tableRow}>
              <View style={[styles.tableCell, styles.projectCell]}>
                <Text style={{ fontWeight: 'bold' }}>{project.projectName}</Text>
                {project.location && (
                  <Text style={{ fontSize: 8, color: colors.muted }}>{project.location}</Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.scoreCell, { color: thresholdColors[project.threshold], fontWeight: 'bold' }]}>
                {project.currentScore.toFixed(0)}
              </Text>
              <Text style={[
                styles.tableCell, 
                styles.changeCell,
                { color: project.scoreDelta > 0 ? colors.danger : project.scoreDelta < 0 ? colors.success : colors.muted }
              ]}>
                {project.scoreDelta > 0 ? '+' : ''}{project.scoreDelta.toFixed(1)}
              </Text>
              <View style={styles.statusCell}>
                <Text style={[
                  styles.thresholdBadge,
                  { backgroundColor: `${thresholdColors[project.threshold]}30`, color: thresholdColors[project.threshold] }
                ]}>
                  {project.threshold}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ThresholdCrossings({ crossings }: { crossings: WeeklyNewsletterData['thresholdCrossings'] }): React.ReactElement {
  if (crossings.length === 0) return <></>;

  const escalations = crossings.filter(c => c.direction === 'escalated');
  const deescalations = crossings.filter(c => c.direction === 'deescalated');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Threshold Changes</Text>

      {escalations.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.danger, marginBottom: 6 }}>
            Escalated ({escalations.length})
          </Text>
          {escalations.map((crossing) => (
            <View key={crossing.projectId} style={[styles.crossingItem, { backgroundColor: `${colors.danger}10`, borderLeftColor: colors.danger }]}>
              <Text style={styles.crossingTitle}>{crossing.projectName}</Text>
              <Text style={styles.crossingDetail}>
                {crossing.previousThreshold} → {crossing.currentThreshold} (Score: {crossing.currentScore.toFixed(0)})
              </Text>
            </View>
          ))}
        </View>
      )}

      {deescalations.length > 0 && (
        <View>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.success, marginBottom: 6 }}>
            De-escalated ({deescalations.length})
          </Text>
          {deescalations.map((crossing) => (
            <View key={crossing.projectId} style={[styles.crossingItem, { backgroundColor: `${colors.success}10`, borderLeftColor: colors.success }]}>
              <Text style={styles.crossingTitle}>{crossing.projectName}</Text>
              <Text style={styles.crossingDetail}>
                {crossing.previousThreshold} → {crossing.currentThreshold} (Score: {crossing.currentScore.toFixed(0)})
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function TopRiskThemes({ themes }: { themes: RiskCategoryTrend[] }): React.ReactElement {
  if (themes.length === 0) return <></>;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Risk Themes</Text>
      
      <View style={styles.themesGrid}>
        {themes.slice(0, 4).map((theme) => (
          <View key={theme.category} style={[styles.themeCard, styles.themeGridItem]}>
            <Text style={styles.themeTitle}>{categoryLabels[theme.category]}</Text>
            <Text style={styles.themeCount}>
              {theme.projectCount} project{theme.projectCount !== 1 ? 's' : ''} affected
            </Text>
            {theme.topProjects.slice(0, 3).map((p) => (
              <Text key={p.projectId} style={styles.themeProject}>{p.projectName}</Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function NewSignals({ signals }: { signals: RiskSignalSummary[] }): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>New Risk Signals ({signals.length})</Text>
      
      {signals.slice(0, 12).map((signal) => (
        <View key={signal.signalId} style={[styles.signalItem, { borderLeftColor: colors.warning }]}>
          <View style={styles.signalHeader}>
            <Text style={[styles.signalBadge, { backgroundColor: colors.warning, color: 'white' }]}>
              {signal.severity}
            </Text>
            <Text style={[styles.signalBadge, { backgroundColor: colors.border, color: colors.muted }]}>
              {categoryLabels[signal.category]}
            </Text>
          </View>
          <Text style={styles.signalTitle}>{signal.title}</Text>
          <Text style={styles.signalDetail}>
            {signal.projectName} • {format(signal.detectedAt, 'MMM d')}
          </Text>
        </View>
      ))}

      {signals.length > 12 && (
        <Text style={styles.emptyText}>+ {signals.length - 12} more signals</Text>
      )}
    </View>
  );
}

function ResolvedSignals({ signals }: { signals: RiskSignalSummary[] }): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.success }]}>
        Resolved This Week ({signals.length})
      </Text>
      
      {signals.slice(0, 8).map((signal) => (
        <View key={signal.signalId} style={[styles.signalItem, { borderLeftColor: colors.success, backgroundColor: `${colors.success}10` }]}>
          <Text style={[styles.signalTitle, { textDecoration: 'line-through', color: colors.muted }]}>
            {signal.title}
          </Text>
          <Text style={styles.signalDetail}>{signal.projectName}</Text>
        </View>
      ))}
    </View>
  );
}

function Footer({ generatedAt, pageNumber }: { generatedAt: Date; pageNumber: number }): React.ReactElement {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Generated on {format(generatedAt, 'MMMM d, yyyy')} | ClaimZero Construction Risk Intelligence
      </Text>
      <Text style={styles.pageNumber}>Page {pageNumber}</Text>
    </View>
  );
}

export default NewsletterPDF;
