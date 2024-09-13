---
id: 5d77fb4d-107d-42a0-ba94-2536d3cdee64
title: Welcome to morethan log!
created_time: 2024-09-13T02:54:00.000Z
last_edited_time: 2024-09-13T03:16:00.000Z
date: 2023-01-22T00:00:00.000Z
thumbnail: ./image_Kze1lCb1.png
type: Post
slug: docs
category: Docs
tags:
  - Docs
  - Morethanlog
updated_at: 2024-09-13T03:16:00.000Z
author:
  - object: user
    id: e5ed41b6-1017-4d12-bdba-ee217703dd05
status: Public

---

# morethan log

Next.js static blog using Notion as a Content Management System (CMS). Supports both Blog format Post as well as Page format for Resume. Deployed using Vercel.

[Repository](https://github.com/morethanmin/morethan-log) | [Demo Blog](https://morethan-log.vercel.app/) | [Demo Resume](https://morethan-log.vercel.app/resume)

## Features

**📒 Writing posts using notion**

*   No need of commiting to Github for posting anything to your website.

*   Posts made on Notion are automaticaly updated on your site.

**📄 Use as a page as resume**

*   Useful for generating full page sites using Notion.

*   Can be used for Resume, Portfolios etc.

**👀 SEO friendly**

*   Dynamically generates OG IMAGEs (thumbnails!) for posts. ([og-image-korean](https://github.com/morethanmin/og-image-korean)).

*   Dynamically creates sitemap for posts.

**🤖 Customisable and Supports various plugin through CONFIG**

*   Your profile information can be updated through Config. (`site.config.js`)

*   Plugins support includes, Google Analytics, Search Console and also Commenting using Github Issues(Utterances).

## Getting Started

To use morethan-log, you must follow the steps below.

### Deploy on [vercel](https://vercel.com/)

*   Star this repo.

*   [Fork](https://github.com/morethanmin/morethan-log/fork) the repo to your Profile.

*   Duplicate [this Notion template](/c5e396e0ba1345faad1cacddffe1cf53), and Share to Web.

*   Copy the Web Link and keep note of the Notion Page Id from the Link which will be in this format \[username.notion.site/`NOTION_PAGE_ID`?v=`VERSION_ID`].

*   Clone your forked repo and then customize `site.config.js` based on your preference.

*   Deploy on [Vercel](https://vercel.com/), with the following environment variables.

    *   `NOTION_PAGE_ID` (Required): The Notion page Id got from the Share to Web URL.

    *   `GOOGLE_MEASUREMENT_ID` : For Google analytics Plugin.

    *   `GOOGLE_SITE_VERIFICATION` : For Google search console Plugin.

### Set your blog configuration

You can set your blog configuration by editing `site.config.js`.

### Writing Post

When you write a post, you should check the properties below.

**Property**|**type**|**Required**|**Description**
\---|---|---|---
**title**|`string`|`true`|Display in the post title area.
**date**|`date`|`true`|Display in the post date area.
**slug**|`string`|`true`|Set the post slug. (eg. https://morethan-log.vercel.app/\[slug-id])
**author**|`author`|`false`|Display in the post author area.
**status**|`Private` `Public` `PublicOnDetail`|`true`|`Private` is Not showing on your blog.
`Public` is Showing on your blog.
`PublicOnDetail` is Showing only your blog detail page.
**tags**|`string[]`|`false`|Display in the post tags area.
**summary**|`string`|`false`|Display in the post **summary** area.
**type**|`Post` `Paper`|`true`|`Post` is Commonly used post type.
`Paper` is  Used when you want to create a page like [Resume](https://morethan-log.vercel.app/resume).
**thumbnail**|`file`|`false`|Display in the post thumbnail area.

## Contributing

Check out the [Contributing Guide](https://file+.vscode-resource.vscode-cdn.net/Users/leesangmin/workspace/morethan-log/.github/CONTRIBUTING.md).
