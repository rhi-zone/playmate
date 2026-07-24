import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import fs from 'node:fs'
import path from 'node:path'

// Auto-generate sidebar items from a directory
function getSidebarItems(dir: string) {
  const fullPath = path.join(__dirname, '..', dir)
  if (!fs.existsSync(fullPath)) {
    return []
  }

  return fs
    .readdirSync(fullPath)
    .filter((file) => file.endsWith('.md') && file !== 'index.md')
    .map((file) => {
      const name = path.basename(file, '.md')
      // Convert kebab-case to Title Case
      const text = name
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      return { text, link: `/${dir}/${name}` }
    })
}

export default withMermaid(
  defineConfig({
    vite: {
      optimizeDeps: {
        include: ['mermaid'],
      },
    },
    title: 'playmate',
    description: 'Game design primitives',

    base: '/playmate/',

    srcExclude: ['**/CLAUDE.md'],

    themeConfig: {
      nav: [
        { text: 'Guide', link: '/introduction' },
        { text: 'Design', link: '/philosophy' },
        { text: 'Primitives', link: '/primitives/' },
        { text: 'rhi', link: 'https://docs.rhi.zone/' },
      ],

      sidebar: {
        '/': [
          {
            text: 'Guide',
            items: [
              { text: 'Introduction', link: '/introduction' },
              { text: 'Getting Started', link: '/getting-started' },
            ]
          },
          {
            text: 'Design',
            items: [
              { text: 'Philosophy', link: '/philosophy' },
              { text: 'Prior Art', link: '/prior-art' },
              { text: 'Architecture', link: '/architecture' },
            ]
          },
          {
            text: 'Design Docs',
            collapsed: true,
            items: getSidebarItems('design'),
          },
          {
            text: 'Primitives',
            items: [
              { text: 'State Machines', link: '/primitives/state-machines' },
              { text: 'Character Controllers', link: '/primitives/character-controllers' },
              { text: 'Camera Controllers', link: '/primitives/camera-controllers' },
            ]
          },
        ]
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/rhi-zone/playmate' }
      ],

      search: {
        provider: 'local'
      },

      editLink: {
        pattern: 'https://github.com/rhi-zone/playmate/edit/master/docs/:path',
        text: 'Edit this page on GitHub'
      },
    },
  }),
)
