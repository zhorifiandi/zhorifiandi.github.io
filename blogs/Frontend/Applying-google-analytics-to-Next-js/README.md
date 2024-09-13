---
id: 9ca5e591-e2c8-4660-8601-c0bb8db17c55
title: Applying google analytics to Next.js
created_time: 2024-09-13T02:54:00.000Z
last_edited_time: 2024-09-13T03:16:00.000Z
date: 2022-06-17T00:00:00.000Z
type: Post
slug: how-to-apply-ga-to-next.js
category: Frontend
tags:
  - Next.js
  - GA
summary: Let's understand the principle and apply ga to next.js 😎
updated_at: 2024-09-13T03:16:00.000Z
author:
  - object: user
    id: e5ed41b6-1017-4d12-bdba-ee217703dd05
status: Public
_thumbnail: ./Untitled_4lcdtDN0.png

---

## Getting Started

Recently, while working on Next.js-based personal blogs and personal projects, there are cases where you need to apply google analytics, so let's summarize them.

## Applying Attributes in Google Analytics

First, create an account as shown in the picture below, create properties, create a stream, and put the URL of your website in the stream URL. When it was first created, it was not linked, so of course it was not activated. At this time, since you need to insert the measurement ID, remember the ID.

![](./Untitled_4lcdtDN0.png)

If you look at the guide for tagging, it says that you can apply the code below.

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=[측정ID]"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '[ID]');
</script>
```

Let's apply the code to the Next.js project 🙂

## Setting tags in Next.js

### Create a `Scripts` component that loads the gtag script

Create a component called Scripts that applies third-party scripts as shown below.

```javascript
import Script from 'next/script'
import BLOG from '@/blog.config'

const Scripts = () => (
  <>
    {BLOG?.googleAnalytics?.enable === true && (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${BLOG.googleAnalytics.config.measurementId}`}
        />
        <Script strategy="lazyOnload" id="ga">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${BLOG.googleAnalytics.config.measurementId}', {
              page_path: window.location.pathname,
            });`}
        </Script>
      </>
    )}
  </>
)

export default Scripts
```

A `script` can be added to the `head`, but a component called `Script` provided by Next.js was used. If this component is used, priority can be set between third-party scripts through the strategy property and loading can be optimized.

In the code above, strategy is set to afterInteractive in the first Script tag (default value), and lazyOnload is set in the second Script tag. Let's take a look at each property as follows.

*   afterInteractive : Applies the corresponding script to the case of client-side.

*   lazyOnload : Applies when all other resources are applied.

By making this setting, you can set the priority so that the script that applies the gtag is executed after the gtag is defined.

### Creating a `Gtag` component that detects page movement

Since the Next.js-based project is SPA (single-page-application), GA cannot detect page movement. So, when the page is changed arbitrarily, an event handler must be defined and executed.

**components/Gtag.js**

```javascript
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import * as gtag from '@/lib/gtag'

const Gtag = () => {
  const router = useRouter()
  useEffect(() => {
    const handleRouteChange = url => {
      gtag.pageview(url)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])
  return null
}
export default Gtag
```

When the corresponding component is loaded through the useEffect hook, an event handler for router change is hung.

**libs/gtag.js**

```javascript
import BLOG from '@/blog.config'
export const GA_TRACKING_ID = BLOG.googleAnalytics.config.measurementId

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = url => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url
  })
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value
  })
}
```

### Apply to `_app.js` component

Apply the created component to \_app.js and you're done!

```javascript
import 'prismjs/themes/prism.css'
import 'react-notion-x/src/styles.css'
import 'katex/dist/katex.min.css'
import '@/styles/globals.css'
import '@/styles/notion.css'
import BLOG from '@/blog.config'
import dynamic from 'next/dynamic'
import { LocaleProvider } from '@/lib/locale'
import Scripts from '@/components/Scripts'

const Gtag = dynamic(() => import('@/components/Gtag'), { ssr: false })

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Scripts />
      <LocaleProvider>
        <>
          {BLOG.isProd && BLOG?.googleAnalytics?.enable === true && <Gtag />}
          <Component {...pageProps} />
        </>
      </LocaleProvider>
    </>
  )
}

export default MyApp
```

At this time, one thing to be careful about is that the gtag component should work only when it is client-side (because gtag is used for the window object), so dynamic provided by Next.js was used.

## concluding

Actually, if you copy and paste what is on the Internet, it will be over, but I think it was worth trying to organize at least once as I consider it important to understand one by one. In the case of web services, most of them are attached.
