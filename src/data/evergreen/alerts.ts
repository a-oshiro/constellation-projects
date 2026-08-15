import type { Alert, AlertActivityEntry, AlertCategory, AlertStatus, ReviewStatus } from '../types';
import { CURRENT_USER } from '../mockData';
import constellationLogo from '../../assets/constellation-logo.png'

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

const AI_AGENT = { actorName: 'AI AutoAgent', actorAvatar: constellationLogo
 };
const JOHN_DOE = { actorName: CURRENT_USER.name, actorEmail: 'john.doe@mail.com', actorAvatar: CURRENT_USER.avatarUrl };
/** Second reviewer persona — demonstrates that the email and assets tracks can be approved/rejected by different people. */
const MICHAEL_STUART = { actorName: 'Michael Stuart', actorEmail: 'm.stuart@company.com', actorAvatar: 'https://i.pravatar.cc/40?img=52' };

const OTHER_YMMT_IDS = [
  'sea-offer-330i-sedan',
  'sea-offer-x5-xdrive40i',
  'sea-offer-x5-xdrive50e',
  'sea-offer-x5-sdrive40i',
  'sea-offer-m340i-sedan',
];

const ALL_OFFER_IDS = [
  'sea-offer-x3-30xdrive',
  'sea-offer-x1-xdrive28i',
  'sea-offer-330i-sedan',
  'sea-offer-x5-xdrive40i',
  'sea-offer-x5-xdrive50e',
  'sea-offer-x5-sdrive40i',
  'sea-offer-m340i-sedan',
];

const othersExcept = (featuredId: string) => ALL_OFFER_IDS.filter((id) => id !== featuredId);

interface ArchivedMockSpec {
  id: string;
  category: AlertCategory;
  subject: string;
  featuredOfferId: string;
  vin: string;
  status: AlertStatus;
  emailStatus: ReviewStatus;
  assetsStatus: ReviewStatus;
  createdDaysAgo: number;
  archivedDaysAgo: number;
}

/** Builds a full mock Alert (with a plausible activity trail) from a compact spec — used to bulk-seed the Archived Alerts dialog. */
function makeArchivedAlert(spec: ArchivedMockSpec): Alert {
  const createdAt = now - spec.createdDaysAgo * DAY;
  const archivedAt = now - spec.archivedDaysAgo * DAY;
  const activity: AlertActivityEntry[] = [
    { id: `act-${spec.id}-generated`, action: 'generated', timestamp: createdAt, ...AI_AGENT },
  ];
  if (spec.emailStatus !== 'pending') {
    activity.push({
      id: `act-${spec.id}-email`,
      action: spec.emailStatus === 'approved' ? 'email_approved' : 'email_rejected',
      timestamp: createdAt + DAY,
      ...MICHAEL_STUART,
    });
  }
  if (spec.assetsStatus !== 'pending') {
    activity.push({
      id: `act-${spec.id}-assets`,
      action: spec.assetsStatus === 'approved' ? 'assets_approved' : 'assets_rejected',
      timestamp: createdAt + 2 * DAY,
      ...JOHN_DOE,
    });
  }
  if (spec.status === 'sent') {
    activity.push({ id: `act-${spec.id}-sent`, action: 'sent', timestamp: createdAt + 3 * DAY, ...JOHN_DOE });
  }
  activity.push({ id: `act-${spec.id}-archived`, action: 'archived', timestamp: archivedAt, ...JOHN_DOE });

  return {
    id: spec.id,
    category: spec.category,
    subject: spec.subject,
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      `${spec.subject}.`,
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: spec.featuredOfferId,
    otherOfferIds: othersExcept(spec.featuredOfferId),
    vin: spec.vin,
    status: spec.status,
    emailStatus: spec.emailStatus,
    assetsStatus: spec.assetsStatus,
    createdAt,
    activity,
    archivedAt,
  };
}

/** 20 additional archived alerts — bulk mock data so the Archived Alerts dialog can be exercised with a larger, more realistic list. */
const BULK_ARCHIVED_ALERTS: Alert[] = [
  { id: 'sea-alert-arch-01', category: 'Conquest', subject: 'Bellevue BMW cleared 12 New 2026 BMW X1 xDrive28i in the last 90 days', featuredOfferId: 'sea-offer-x1-xdrive28i', vin: 'WBX73EF01T5561234', status: 'sent', emailStatus: 'approved', assetsStatus: 'approved', createdDaysAgo: 95, archivedDaysAgo: 40 },
  { id: 'sea-alert-arch-02', category: 'Aging', subject: 'Your New 2026 BMW 330i Sedan has been sitting for 55 days', featuredOfferId: 'sea-offer-330i-sedan', vin: 'WBA5R7C09PFH67891', status: 'generated', emailStatus: 'pending', assetsStatus: 'pending', createdDaysAgo: 55, archivedDaysAgo: 8 },
  { id: 'sea-alert-arch-03', category: 'MSRP', subject: 'Sound BMW holds a lower MSRP on the New 2026 BMW X5 xDrive50e', featuredOfferId: 'sea-offer-x5-xdrive50e', vin: '5UXTA6C03N9N45671', status: 'approved', emailStatus: 'approved', assetsStatus: 'approved', createdDaysAgo: 42, archivedDaysAgo: 15 },
  { id: 'sea-alert-arch-04', category: 'Offers', subject: 'Northwest BMW beats your lease on the New 2026 BMW M340i Sedan', featuredOfferId: 'sea-offer-m340i-sedan', vin: 'WBA53AR08PFJ67823', status: 'rejected', emailStatus: 'rejected', assetsStatus: 'pending', createdDaysAgo: 70, archivedDaysAgo: 25 },
  { id: 'sea-alert-arch-05', category: 'De-Listing', subject: 'The New 2026 BMW X3 30 xDrive is being de-listed next month', featuredOfferId: 'sea-offer-x3-30xdrive', vin: '5UX53GP04T9535599', status: 'sent', emailStatus: 'approved', assetsStatus: 'approved', createdDaysAgo: 110, archivedDaysAgo: 60 },
  { id: 'sea-alert-arch-06', category: 'Inventory Gaps/Levels', subject: 'Demand for the New 2026 BMW X5 xDrive40i continues to outpace your inventory', featuredOfferId: 'sea-offer-x5-xdrive40i', vin: '5UXCR6C04N9L67892', status: 'generated', emailStatus: 'pending', assetsStatus: 'pending', createdDaysAgo: 18, archivedDaysAgo: 3 },
  { id: 'sea-alert-arch-07', category: 'FTC', subject: 'Your New 2026 BMW X1 xDrive28i advertisement may not meet FTC disclosure requirements', featuredOfferId: 'sea-offer-x1-xdrive28i', vin: 'WBX73EF03T5572345', status: 'rejected', emailStatus: 'rejected', assetsStatus: 'pending', createdDaysAgo: 30, archivedDaysAgo: 12 },
  { id: 'sea-alert-arch-08', category: 'Conquest', subject: 'Irvine BMW cleared 9 New 2026 BMW X5 sDrive40i in the last 60 days', featuredOfferId: 'sea-offer-x5-sdrive40i', vin: '5UXTA6C05N9M78903', status: 'approved', emailStatus: 'approved', assetsStatus: 'approved', createdDaysAgo: 65, archivedDaysAgo: 20 },
  { id: 'sea-alert-arch-09', category: 'Aging', subject: 'Your New 2026 BMW X5 xDrive50e has been sitting for 92 days', featuredOfferId: 'sea-offer-x5-xdrive50e', vin: '5UXTA6C07N9N89014', status: 'sent', emailStatus: 'approved', assetsStatus: 'approved', createdDaysAgo: 92, archivedDaysAgo: 45 },
  { id: 'sea-alert-arch-10', category: 'MSRP', subject: 'Bellevue BMW is beating you on the New 2026 BMW 330i Sedan', featuredOfferId: 'sea-offer-330i-sedan', vin: 'WBA5R7C02PFH90125', status: 'generated', emailStatus: 'pending', assetsStatus: 'pending', createdDaysAgo: 25, archivedDaysAgo: 6 },
  { id: 'sea-alert-arch-11', category: 'Offers', subject: 'Overlake BMW undercuts your lease on the New 2026 BMW X1 xDrive28i', featuredOfferId: 'sea-offer-x1-xdrive28i', vin: 'WBX73EF05T5583456', status: 'rejected', emailStatus: 'approved', assetsStatus: 'rejected', createdDaysAgo: 48, archivedDaysAgo: 18 },
  { id: 'sea-alert-arch-12', category: 'Inventory Gaps/Levels', subject: 'Demand for the New 2026 BMW M340i Sedan is outpacing your inventory', featuredOfferId: 'sea-offer-m340i-sedan', vin: 'WBA53AR01PFJ01236', status: 'generated', emailStatus: 'pending', assetsStatus: 'pending', createdDaysAgo: 14, archivedDaysAgo: 1 },
  { id: 'sea-alert-arch-13', category: 'Conquest', subject: 'Northwest BMW cleared 18 New 2026 BMW X3 30 xDrive in the last 90 days', featuredOfferId: 'sea-offer-x3-30xdrive', vin: '5UX53GP06T9546670', status: 'approved', emailStatus: 'approved', assetsStatus: 'approved', createdDaysAgo: 88, archivedDaysAgo: 33 },
  { id: 'sea-alert-arch-14', category: 'Aging', subject: 'Your New 2026 BMW X5 xDrive40i has been sitting for 66 days', featuredOfferId: 'sea-offer-x5-xdrive40i', vin: '5UXCR6C06N9L12347', status: 'sent', emailStatus: 'approved', assetsStatus: 'approved', createdDaysAgo: 66, archivedDaysAgo: 22 },
  { id: 'sea-alert-arch-15', category: 'MSRP', subject: 'Sound BMW holds a lower MSRP on the New 2026 BMW X5 sDrive40i', featuredOfferId: 'sea-offer-x5-sdrive40i', vin: '5UXTA6C09N9M23458', status: 'rejected', emailStatus: 'rejected', assetsStatus: 'pending', createdDaysAgo: 36, archivedDaysAgo: 10 },
  { id: 'sea-alert-arch-16', category: 'Offers', subject: 'Bellevue BMW beats your lease on the New 2026 BMW X5 xDrive50e', featuredOfferId: 'sea-offer-x5-xdrive50e', vin: '5UXTA6C01N9N34569', status: 'generated', emailStatus: 'pending', assetsStatus: 'pending', createdDaysAgo: 20, archivedDaysAgo: 4 },
  { id: 'sea-alert-arch-17', category: 'De-Listing', subject: 'The New 2026 BMW M340i Sedan is being de-listed next quarter', featuredOfferId: 'sea-offer-m340i-sedan', vin: 'WBA53AR03PFJ45670', status: 'sent', emailStatus: 'approved', assetsStatus: 'approved', createdDaysAgo: 100, archivedDaysAgo: 52 },
  { id: 'sea-alert-arch-18', category: 'FTC', subject: 'Your New 2026 BMW 330i Sedan advertisement may not meet FTC disclosure requirements', featuredOfferId: 'sea-offer-330i-sedan', vin: 'WBA5R7C04PFH56781', status: 'rejected', emailStatus: 'rejected', assetsStatus: 'pending', createdDaysAgo: 40, archivedDaysAgo: 14 },
  { id: 'sea-alert-arch-19', category: 'Conquest', subject: 'Overlake BMW cleared 14 New 2026 BMW X1 xDrive28i in the last 120 days', featuredOfferId: 'sea-offer-x1-xdrive28i', vin: 'WBX73EF07T5594567', status: 'approved', emailStatus: 'approved', assetsStatus: 'approved', createdDaysAgo: 125, archivedDaysAgo: 70 },
  { id: 'sea-alert-arch-20', category: 'Offers', subject: 'Irvine BMW undercuts your lease on the New 2026 BMW X3 30 xDrive', featuredOfferId: 'sea-offer-x3-30xdrive', vin: '5UX53GP08T9557891', status: 'generated', emailStatus: 'pending', assetsStatus: 'pending', createdDaysAgo: 22, archivedDaysAgo: 5 },
].map(makeArchivedAlert);

/**
 * 4 alerts for "Evergreen BMW of Seattle", one per reference email, seeded one-per-column
 * so the board demonstrates the full Generated -> Rejected/Approved -> Sent lifecycle.
 * Each alert's email and assets are reviewed independently — `emailStatus`/`assetsStatus` drive
 * the two rows on the Kanban card, and `status` is always the derived combination of the two.
 */
export const SEATTLE_ALERTS: Alert[] = [
  {
    id: 'sea-alert-irvine-cleared-x3',
    category: 'Conquest',
    subject: 'Irvine BMW cleared 27 New 2026 BMW X3 30 xDrive in the last 120 days',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'The most popular X3 delisted in your area is the New 2026 BMW X3 30 xDrive at an MSRP of $58,450 — 19 units cleared across your market. Irvine BMW cleared 9 of them.',
      'Across all X3 30 builds, Irvine BMW moved 27 to your 23, putting you 2nd of 4 dealers in your own market.',
      "And it's not just volume: Irvine BMW clears the $58,450 build in about 44 days, while you take 46.",
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-x3-30xdrive',
    otherOfferIds: OTHER_YMMT_IDS.concat('sea-offer-x1-xdrive28i'),
    vin: '5UX53GP0T9513011',
    status: 'generated',
    emailStatus: 'approved',
    assetsStatus: 'pending',
    createdAt: now - 7 * DAY,
    activity: [
      { id: 'act-1-generated', action: 'generated', timestamp: now - 7 * DAY, ...AI_AGENT },
      { id: 'act-1-email-approved', action: 'email_approved', timestamp: now - 2 * DAY, ...MICHAEL_STUART },
    ],
  },
  {
    id: 'sea-alert-competition-beating-x3-lease',
    category: 'Offers',
    subject: 'Your competition is beating you on New 2026 BMW X3 30 xDrive leases',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'BMW of Buena Park and Sterling both advertise lower lease payments than you in your area. Buena Park is at $595/month for 39 months with $6,104 due at signing. Sterling is at $599/month for 39 months with $5,229 due at signing.',
      'You are advertising $639/month for 36 months with $4,839 due at signing — up $70 from June.',
      "And you're doing it while holding the lowest base MSRP in the market at $53,300. Buena Park's advertised build is $5,150 higher at $58,450. Sterling's is $2,350 higher at $55,650. You have the cheapest New 2026 BMW X3 30 xDrive in your market and the most expensive lease payment on it.",
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-x3-30xdrive',
    otherOfferIds: OTHER_YMMT_IDS.concat('sea-offer-x1-xdrive28i'),
    vin: '5UX53GP0T9513011',
    status: 'rejected',
    emailStatus: 'rejected',
    assetsStatus: 'pending',
    createdAt: now - 14 * DAY,
    activity: [
      { id: 'act-2-generated', action: 'generated', timestamp: now - 14 * DAY, ...AI_AGENT },
      { id: 'act-2-email-rejected', action: 'email_rejected', timestamp: now - 3 * DAY, ...MICHAEL_STUART },
    ],
  },
  {
    id: 'sea-alert-irvine-beating-x1',
    category: 'MSRP',
    subject: 'Irvine BMW is beating you on the New 2026 BMW X1 xDrive28i',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'Irvine BMW MSRP on 2026 X1 xDrive28i is $44,635. Yours is $2,580 higher, at $47,215.',
      'Reduce your price on this YMMT to win: $44,635.',
      'Advertise this VIN:',
    ],
    featuredOfferId: 'sea-offer-x1-xdrive28i',
    otherOfferIds: OTHER_YMMT_IDS.concat('sea-offer-x3-30xdrive'),
    vin: 'WBX73EF08T5548316',
    status: 'approved',
    emailStatus: 'approved',
    assetsStatus: 'approved',
    createdAt: now - 10 * DAY,
    activity: [
      { id: 'act-3-generated', action: 'generated', timestamp: now - 10 * DAY, ...AI_AGENT },
      { id: 'act-3-email-approved', action: 'email_approved', timestamp: now - 5 * DAY, ...MICHAEL_STUART },
      { id: 'act-3-assets-approved', action: 'assets_approved', timestamp: now - 4 * DAY, ...JOHN_DOE },
    ],
  },
  {
    id: 'sea-alert-highest-aging-x1',
    category: 'Aging',
    subject: 'You have the highest amount of aging New 2026 BMW X1 xDrive28i in your area',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'Your $47,215 MSRP on the New 2026 BMW X1 xDrive28i is driving business to your competition. That unit has been on the lot 178 days — the oldest X1 in your market and the oldest anywhere in your competitive set.',
      'Irvine BMW holds the lowest X1 28i MSRP in the market, $2,580 below you, and their inventory is 8 to 9 days old. They’re turning the exact trim you are sitting on.',
      'Here is the VIN you need to advertise:',
    ],
    featuredOfferId: 'sea-offer-x1-xdrive28i',
    otherOfferIds: OTHER_YMMT_IDS.concat('sea-offer-x3-30xdrive'),
    vin: 'WBX73EF08T5548316',
    status: 'sent',
    emailStatus: 'approved',
    assetsStatus: 'approved',
    createdAt: now - 16 * DAY,
    activity: [
      { id: 'act-4-generated', action: 'generated', timestamp: now - 16 * DAY, ...AI_AGENT },
      { id: 'act-4-email-approved', action: 'email_approved', timestamp: now - 6 * DAY, ...MICHAEL_STUART },
      { id: 'act-4-assets-approved', action: 'assets_approved', timestamp: now - 5 * DAY, ...JOHN_DOE },
      { id: 'act-4-sent', action: 'sent', timestamp: now - 3 * DAY, ...JOHN_DOE },
    ],
  },

  // ── 8 additional alerts, randomly distributed across columns (not an even split) ──

  {
    id: 'sea-alert-bellevue-undercuts-330i',
    category: 'Offers',
    subject: 'Bellevue BMW is undercutting you on the New 2026 BMW 330i Sedan',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'Bellevue BMW advertises the New 2026 BMW 330i Sedan at $459/month for 36 months with $2,999 due at signing — $20 less per month than your $479 offer.',
      "Their advertised build is $500 below your MSRP, and they've moved 14 units in the last 60 days to your 8.",
      'Matching their payment keeps you competitive on this build without cutting into margin.',
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-330i-sedan',
    otherOfferIds: othersExcept('sea-offer-330i-sedan'),
    vin: 'WBA5R7C05PFH23456',
    status: 'generated',
    emailStatus: 'pending',
    assetsStatus: 'approved',
    createdAt: now - 3 * DAY,
    activity: [
      { id: 'act-5-generated', action: 'generated', timestamp: now - 3 * DAY, ...AI_AGENT },
      { id: 'act-5-assets-approved', action: 'assets_approved', timestamp: now - 1 * DAY, ...JOHN_DOE },
    ],
  },
  {
    id: 'sea-alert-x5-40i-demand-spike',
    category: 'Inventory Gaps/Levels',
    subject: 'Demand for the New 2026 BMW X5 xDrive40i is outpacing your inventory',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'Search volume for the New 2026 BMW X5 xDrive40i in your area is up 34% month over month, but your ad spend on this YMMT hasn’t moved.',
      "Northwest BMW is capturing the overflow — they've added two additional creatives for this build in the last two weeks.",
      'Increasing frequency on this VIN now would let you capture demand before your competitors absorb it.',
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-x5-xdrive40i',
    otherOfferIds: othersExcept('sea-offer-x5-xdrive40i'),
    vin: '5UXCR6C0XN9L45678',
    status: 'generated',
    emailStatus: 'pending',
    assetsStatus: 'pending',
    createdAt: now - 5 * DAY,
    activity: [
      { id: 'act-6-generated', action: 'generated', timestamp: now - 5 * DAY, ...AI_AGENT },
    ],
  },
  {
    id: 'sea-alert-x5-sdrive-aging',
    category: 'Aging',
    subject: 'Your New 2026 BMW X5 sDrive40i has been sitting for 61 days',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'The New 2026 BMW X5 sDrive40i on your lot has 61 days of age — well past your 45-day turn target.',
      'Comparable X5 sDrive40i builds at competing dealers are turning in 28 days on average.',
      'A refreshed creative with a sharper payment could help move this unit before it ages further.',
      'Here is the VIN you need to advertise:',
    ],
    featuredOfferId: 'sea-offer-x5-sdrive40i',
    otherOfferIds: [],
    vin: '5UXTA6C09N9M67890',
    status: 'generated',
    emailStatus: 'pending',
    assetsStatus: 'pending',
    createdAt: now - 9 * DAY,
    activity: [
      { id: 'act-7-generated', action: 'generated', timestamp: now - 9 * DAY, ...AI_AGENT },
    ],
  },
  {
    id: 'sea-alert-overlake-beats-m340i-lease',
    category: 'Offers',
    subject: 'Overlake BMW beats your lease on the New 2026 BMW M340i Sedan',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'Overlake BMW advertises the New 2026 BMW M340i Sedan at $589/month for 36 months with $3,299 due at signing — $30 less per month than your $619 offer.',
      'Their base MSRP is only $200 below yours, so most of the gap comes from payment structure, not price.',
      'Adjusting your down payment could close this gap without changing your advertised MSRP.',
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-m340i-sedan',
    otherOfferIds: othersExcept('sea-offer-m340i-sedan'),
    vin: 'WBA53AR0XPFJ12398',
    status: 'rejected',
    emailStatus: 'approved',
    assetsStatus: 'rejected',
    createdAt: now - 20 * DAY,
    activity: [
      { id: 'act-8-generated', action: 'generated', timestamp: now - 20 * DAY, ...AI_AGENT },
      { id: 'act-8-email-approved', action: 'email_approved', timestamp: now - 7 * DAY, ...MICHAEL_STUART },
      { id: 'act-8-assets-rejected', action: 'assets_rejected', timestamp: now - 6 * DAY, ...JOHN_DOE },
    ],
  },
  {
    id: 'sea-alert-x5-50e-demand-spike',
    category: 'Conquest',
    subject: 'The New 2026 BMW X5 xDrive50e is your fastest-moving YMMT this month',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'The New 2026 BMW X5 xDrive50e is generating 2.5x more clicks per dollar spent than any other model in your current rotation.',
      'Sound BMW increased their budget on this build last week and is now outspending you 3 to 1.',
      'Shifting additional budget toward this VIN now would let you keep pace while demand is high.',
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-x5-xdrive50e',
    otherOfferIds: [],
    vin: '5UXTA6C08N9N23456',
    status: 'approved',
    emailStatus: 'approved',
    assetsStatus: 'approved',
    createdAt: now - 12 * DAY,
    activity: [
      { id: 'act-9-generated', action: 'generated', timestamp: now - 12 * DAY, ...AI_AGENT },
      { id: 'act-9-email-approved', action: 'email_approved', timestamp: now - 3 * DAY, ...MICHAEL_STUART },
      { id: 'act-9-assets-approved', action: 'assets_approved', timestamp: now - 2 * DAY, ...JOHN_DOE },
    ],
  },
  {
    id: 'sea-alert-330i-aging',
    category: 'Aging',
    subject: 'Your New 2026 BMW 330i Sedan is the oldest 330i in your market',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'Your New 2026 BMW 330i Sedan has been on the lot 84 days — the oldest 330i Sedan across your entire competitive set.',
      'Bellevue BMW and Overlake BMW both turn this build in under 35 days on average.',
      'A limited-time payment reduction on this VIN could help you clear it before it ages further.',
      'Here is the VIN you need to advertise:',
    ],
    featuredOfferId: 'sea-offer-330i-sedan',
    otherOfferIds: othersExcept('sea-offer-330i-sedan'),
    vin: 'WBA5R7C07PFH34567',
    status: 'approved',
    emailStatus: 'approved',
    assetsStatus: 'approved',
    createdAt: now - 25 * DAY,
    activity: [
      { id: 'act-10-generated', action: 'generated', timestamp: now - 25 * DAY, ...AI_AGENT },
      { id: 'act-10-email-approved', action: 'email_approved', timestamp: now - 9 * DAY, ...MICHAEL_STUART },
      { id: 'act-10-assets-approved', action: 'assets_approved', timestamp: now - 8 * DAY, ...JOHN_DOE },
    ],
  },
  {
    id: 'sea-alert-x5-40i-msrp',
    category: 'MSRP',
    subject: 'Northwest BMW holds a lower MSRP on the New 2026 BMW X5 xDrive40i',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      "Northwest BMW's MSRP on the New 2026 BMW X5 xDrive40i is $850 below yours, and they're advertising it aggressively.",
      "You're currently the highest-priced X5 xDrive40i in your market by MSRP.",
      "Reduce your price on this YMMT to win: match within $850 of Northwest's advertised build.",
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-x5-xdrive40i',
    otherOfferIds: othersExcept('sea-offer-x5-xdrive40i'),
    vin: '5UXCR6C02N9L56789',
    status: 'sent',
    emailStatus: 'approved',
    assetsStatus: 'approved',
    createdAt: now - 28 * DAY,
    activity: [
      { id: 'act-11-generated', action: 'generated', timestamp: now - 28 * DAY, ...AI_AGENT },
      { id: 'act-11-email-approved', action: 'email_approved', timestamp: now - 12 * DAY, ...MICHAEL_STUART },
      { id: 'act-11-assets-approved', action: 'assets_approved', timestamp: now - 11 * DAY, ...JOHN_DOE },
      { id: 'act-11-sent', action: 'sent', timestamp: now - 4 * DAY, ...JOHN_DOE },
    ],
  },
  {
    id: 'sea-alert-m340i-demand-spike',
    category: 'Conquest',
    subject: 'Competitors are outselling you on the New 2026 BMW M340i Sedan',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'Across your market, the New 2026 BMW M340i Sedan is selling 40% faster at competing dealers than at yours.',
      'Overlake BMW alone moved 5 units of this build in the last 30 days versus your 2.',
      'A refreshed creative with updated pricing could help you close this volume gap.',
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-m340i-sedan',
    otherOfferIds: [],
    vin: 'WBA53AR02PFJ45678',
    status: 'sent',
    emailStatus: 'approved',
    assetsStatus: 'approved',
    createdAt: now - 22 * DAY,
    activity: [
      { id: 'act-12-generated', action: 'generated', timestamp: now - 22 * DAY, ...AI_AGENT },
      { id: 'act-12-email-approved', action: 'email_approved', timestamp: now - 10 * DAY, ...MICHAEL_STUART },
      { id: 'act-12-assets-approved', action: 'assets_approved', timestamp: now - 9 * DAY, ...JOHN_DOE },
      { id: 'act-12-sent', action: 'sent', timestamp: now - 1 * DAY, ...JOHN_DOE },
    ],
  },

  // ── Archived alerts — manually archived off the board, shown only in the Archived Alerts dialog ──

  {
    id: 'sea-alert-kickoff-monthly-assets',
    category: 'Offers',
    subject: "Kickoff: Here are this month's assets.",
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      "Here's your first batch of AI-recommended creative for the month, built around your top-performing YMMTs.",
      'Review and approve to get these into market ahead of the competitive set.',
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-x1-xdrive28i',
    otherOfferIds: othersExcept('sea-offer-x1-xdrive28i'),
    vin: 'WBX73EF09T5559427',
    status: 'rejected',
    emailStatus: 'approved',
    assetsStatus: 'pending',
    createdAt: now - 45 * DAY,
    activity: [
      { id: 'act-13-generated', action: 'generated', timestamp: now - 45 * DAY, ...AI_AGENT },
      { id: 'act-13-email-approved', action: 'email_approved', timestamp: now - 40 * DAY, ...MICHAEL_STUART },
      { id: 'act-13-archived', action: 'archived', timestamp: now - 30 * DAY, ...JOHN_DOE },
    ],
    archivedAt: now - 30 * DAY,
  },
  {
    id: 'sea-alert-x3-msrp-archived',
    category: 'MSRP',
    subject: 'Irvine BMW is beating you on the New 2026 BMW X3 30 xDrive',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'Irvine BMW MSRP on 2026 X3 30 xDrive is $2,400 below yours.',
      'Reduce your price on this YMMT to win.',
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-x3-30xdrive',
    otherOfferIds: othersExcept('sea-offer-x3-30xdrive'),
    vin: '5UX53GP02T9524488',
    status: 'sent',
    emailStatus: 'approved',
    assetsStatus: 'approved',
    createdAt: now - 60 * DAY,
    activity: [
      { id: 'act-14-generated', action: 'generated', timestamp: now - 60 * DAY, ...AI_AGENT },
      { id: 'act-14-email-approved', action: 'email_approved', timestamp: now - 55 * DAY, ...MICHAEL_STUART },
      { id: 'act-14-assets-approved', action: 'assets_approved', timestamp: now - 54 * DAY, ...JOHN_DOE },
      { id: 'act-14-sent', action: 'sent', timestamp: now - 50 * DAY, ...JOHN_DOE },
      { id: 'act-14-archived', action: 'archived', timestamp: now - 35 * DAY, ...JOHN_DOE },
    ],
    archivedAt: now - 35 * DAY,
  },
  {
    id: 'sea-alert-m340i-aging-archived',
    category: 'Aging',
    subject: 'Your New 2026 BMW M340i Sedan has been sitting for 70 days',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'The New 2026 BMW M340i Sedan on your lot has 70 days of age — past your turn target.',
      'Comparable builds at competing dealers are turning much faster.',
      'Here is the VIN you need to advertise:',
    ],
    featuredOfferId: 'sea-offer-m340i-sedan',
    otherOfferIds: [],
    vin: 'WBA53AR06PFJ56712',
    status: 'rejected',
    emailStatus: 'rejected',
    assetsStatus: 'pending',
    createdAt: now - 50 * DAY,
    activity: [
      { id: 'act-15-generated', action: 'generated', timestamp: now - 50 * DAY, ...AI_AGENT },
      { id: 'act-15-email-rejected', action: 'email_rejected', timestamp: now - 44 * DAY, ...MICHAEL_STUART },
      { id: 'act-15-archived', action: 'archived', timestamp: now - 20 * DAY, ...JOHN_DOE },
    ],
    archivedAt: now - 20 * DAY,
  },
  {
    id: 'sea-alert-x5-50e-conquest-archived',
    category: 'Conquest',
    subject: 'Sound BMW cleared 15 New 2026 BMW X5 xDrive50e in the last 90 days',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'Sound BMW is outperforming you on X5 xDrive50e clearance this quarter.',
      'Matching their advertised build could help you close the volume gap.',
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-x5-xdrive50e',
    otherOfferIds: [],
    vin: '5UXTA6C01N9N34509',
    status: 'approved',
    emailStatus: 'approved',
    assetsStatus: 'approved',
    createdAt: now - 38 * DAY,
    activity: [
      { id: 'act-16-generated', action: 'generated', timestamp: now - 38 * DAY, ...AI_AGENT },
      { id: 'act-16-email-approved', action: 'email_approved', timestamp: now - 33 * DAY, ...MICHAEL_STUART },
      { id: 'act-16-assets-approved', action: 'assets_approved', timestamp: now - 32 * DAY, ...JOHN_DOE },
      { id: 'act-16-archived', action: 'archived', timestamp: now - 5 * DAY, ...JOHN_DOE },
    ],
    archivedAt: now - 5 * DAY,
  },
  {
    id: 'sea-alert-330i-inventory-archived',
    category: 'Inventory Gaps/Levels',
    subject: 'Demand for the New 2026 BMW 330i Sedan is outpacing your inventory',
    preheader: 'Constellation Insights',
    bodyParagraphs: [
      'Search volume for the New 2026 BMW 330i Sedan is up sharply this month, but your ad spend hasn’t moved.',
      'Increasing frequency on this VIN now would let you capture demand before competitors absorb it.',
      'Here is the VIN you need to advertise now:',
    ],
    featuredOfferId: 'sea-offer-330i-sedan',
    otherOfferIds: othersExcept('sea-offer-330i-sedan'),
    vin: 'WBA5R7C01PFH45781',
    status: 'generated',
    emailStatus: 'pending',
    assetsStatus: 'pending',
    createdAt: now - 33 * DAY,
    activity: [
      { id: 'act-17-generated', action: 'generated', timestamp: now - 33 * DAY, ...AI_AGENT },
      { id: 'act-17-archived', action: 'archived', timestamp: now - 2 * DAY, ...JOHN_DOE },
    ],
    archivedAt: now - 2 * DAY,
  },

  ...BULK_ARCHIVED_ALERTS,
];
