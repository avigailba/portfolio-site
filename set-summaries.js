try { require('dotenv').config(); } catch (e) {}
process.env.NOTION_API_KEY = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const SUMMARIES = [
  { id: '31135a9ccf7a804caf72da07638205bc', summary: 'Transparent AI usage billing across Wix\'s developer platform' },
  { id: '31135a9ccf7a80358e3cead5465c89f8', summary: 'Redesigned the app installation experience end-to-end' },
  { id: '31135a9ccf7a80bdad92eff1f90e6ecf', summary: 'Improved app review flows for the Wix App Market' },
  { id: '17d35a9ccf7a80c69ceafb3f7973485a', summary: 'A monetisation campaign tool for app developers' },
  { id: 'da073f156b004fbb87d927849587a28c', summary: 'Curated app groupings for discovery and editorial placement' },
  { id: '0f54649479514c65bc990b4b594d0cb1', summary: 'Dashboard for developers to track earnings and payout history' },
  { id: 'b103bffdedd247569c67b422c90cfcd3', summary: 'End-to-end refund process for app purchases' },
  { id: '17d35a9ccf7a8021b6ebcccd15c1d39d', summary: 'Redesigned pricing presentation for marketplace apps' },
  { id: '71024356b51b4ce8b46c21fa3a442020', summary: 'Replaced a spreadsheet-based review process with a structured tool' },
  { id: 'c4b2bd7033384f7792fb167115baac33', summary: 'Streamlined app submission and publishing for developers' },
  { id: '9053adab5f3144159fc991711d4e82f7', summary: 'Settings UI for Wix\'s custom HTML element widget' },
  { id: 'af4b341536b44d5495d067982a1b358c', summary: 'Key management interface for Wix\'s developer platform' },
  { id: '84911e6052cd480c807e6591b58833a9', summary: 'Onboarding flow for creating Wix development sites' },
  { id: 'ad5fdda62b7344068e537404e15ee8ad', summary: 'Coupon and discount tools for app monetisation' },
];

async function run() {
  for (const { id, summary } of SUMMARIES) {
    try {
      await notion.pages.update({
        page_id: id,
        properties: {
          Summary: { rich_text: [{ type: 'text', text: { content: summary } }] },
        },
      });
      console.log(`✓ ${id.slice(0, 8)}… — ${summary.slice(0, 50)}`);
    } catch (e) {
      console.error(`✗ ${id.slice(0, 8)}… — ${e.message}`);
    }
  }
  console.log('Done.');
}

run().catch(err => { console.error(err.message); process.exit(1); });
