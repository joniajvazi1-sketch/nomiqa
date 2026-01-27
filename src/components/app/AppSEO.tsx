import { Helmet } from "react-helmet-async";

/**
 * App-specific SEO component that blocks search engine indexing.
 * All /app/* routes should use this component to prevent
 * native app screens from appearing in Google search results.
 */
export const AppSEO: React.FC = () => {
  return (
    <Helmet>
      {/* Block all search engine indexing for app routes */}
      <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta name="bingbot" content="noindex, nofollow" />
      
      {/* Prevent caching by search engines */}
      <meta name="google" content="nositelinkssearchbox" />
      <meta name="google" content="notranslate" />
      
      {/* No Open Graph or Twitter cards - don't want these pages shared */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Nomiqa App" />
      <meta property="og:description" content="Download the Nomiqa app to access this content." />
      <meta name="twitter:card" content="summary" />
      
      {/* Canonical pointing to main site to consolidate any accidental indexing */}
      <link rel="canonical" href="https://nomiqa-depin.com/download" />
    </Helmet>
  );
};

export default AppSEO;
