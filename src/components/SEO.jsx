import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://indiancorporatewear.com";

const BRAND = {
  name: "SUKO Atelier",
  alternateName: "Indian Corporate Wear by SUKO",
  description:
    "SUKO Atelier creates premium women's corporate wear including tailored power suits, formal blazers, executive suits and modern office outfits designed for confident women leaders in India.",
  logo: `${BASE_URL}/logo.png`,
  instagram: "https://www.instagram.com/icwbysuko"
};

const DEFAULT_TITLE =
  "SUKO Atelier | Premium Women's Formal Wear, Blazers & Power Suits India";

const DEFAULT_DESC =
  "Shop premium women's formal wear, tailored blazers, corporate suits, power suits and executive office outfits by SUKO Atelier. Designed for modern women leaders in India.";

const DEFAULT_IMAGE = `${BASE_URL}/boardroom_banner.jpg`;


export const SEO = ({
  title,
  description,
  image,
  canonicalUrl,
  type = "website",
  productData = null,
  breadcrumbData = null,
  faqData = null
}) => {

  const location = useLocation();

  useEffect(() => {

    const fullTitle = title
      ? `${title} | SUKO Atelier`
      : DEFAULT_TITLE;


    document.title = fullTitle;


    const updateMetaTag = (selector, attribute, value) => {

      let element = document.querySelector(selector);

      if (!element) {

        element = document.createElement("meta");

        const match = selector.match(/\[(.*?)=['"](.*?)['"]\]/);

        if (match) {
          element.setAttribute(match[1], match[2]);
        }

        document.head.appendChild(element);
      }

      element.setAttribute(attribute, value);
    };


    const desc = description || DEFAULT_DESC;

    const ogImage = image
      ? image.startsWith("http")
        ? image
        : `${BASE_URL}${image}`
      : DEFAULT_IMAGE;


    const url =
      canonicalUrl ||
      `${BASE_URL}${location.pathname}`;


    /*
      BASIC SEO
    */

    updateMetaTag(
      "meta[name='description']",
      "content",
      desc
    );


    /*
      OPEN GRAPH
    */

    updateMetaTag(
      "meta[property='og:title']",
      "content",
      fullTitle
    );

    updateMetaTag(
      "meta[property='og:description']",
      "content",
      desc
    );

    updateMetaTag(
      "meta[property='og:image']",
      "content",
      ogImage
    );

    updateMetaTag(
      "meta[property='og:url']",
      "content",
      url
    );

    updateMetaTag(
      "meta[property='og:type']",
      "content",
      type
    );

    updateMetaTag(
      "meta[property='og:site_name']",
      "content",
      BRAND.name
    );


    /*
      TWITTER
    */

    updateMetaTag(
      "meta[name='twitter:card']",
      "content",
      "summary_large_image"
    );

    updateMetaTag(
      "meta[name='twitter:title']",
      "content",
      fullTitle
    );

    updateMetaTag(
      "meta[name='twitter:description']",
      "content",
      desc
    );

    updateMetaTag(
      "meta[name='twitter:image']",
      "content",
      ogImage
    );


    /*
      CANONICAL
    */

    let canonical =
      document.querySelector(
        "link[rel='canonical']"
      );


    if (!canonical) {

      canonical =
        document.createElement("link");

      canonical.rel = "canonical";

      document.head.appendChild(canonical);
    }


    canonical.href = url;



    /*
      REMOVE OLD SCHEMA
    */

    const oldSchema =
      document.getElementById(
        "suko-schema"
      );

    if (oldSchema) {
      oldSchema.remove();
    }


    const schemas = [];


    /*
      ORGANIZATION SCHEMA
    */

    schemas.push({

      "@context": "https://schema.org",

      "@type": "Organization",

      name: BRAND.name,

      alternateName:
        BRAND.alternateName,

      url: BASE_URL,

      logo: BRAND.logo,

      description:
        BRAND.description,

      sameAs: [
        BRAND.instagram
      ]

    });



    /*
      WEBSITE SCHEMA
    */

    schemas.push({

      "@context": "https://schema.org",

      "@type": "WebSite",

      name: BRAND.name,

      url: BASE_URL

    });



    /*
      PRODUCT SCHEMA
    */

    if(productData){

      schemas.push({

        "@context":"https://schema.org",

        "@type":"Product",

        name:
          productData.name || title,


        image:
          productData.images?.map(
            img =>
              img.startsWith("http")
              ? img
              : `${BASE_URL}${img}`
          ) || [ogImage],


        description:
          productData.description ||
          desc,


        sku:
          productData.sku || "",


        category:
          productData.category ||
          "Women's Corporate Wear",


        color:
          productData.color || "",


        material:
          productData.fabric || "",


        brand:{
          "@type":"Brand",
          name: BRAND.name,
          alternateName:
            BRAND.alternateName
        },


        offers:{

          "@type":"Offer",

          url,

          priceCurrency:"INR",

          price:
            productData.price || "0",


          availability:
            productData.stock === 0
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock"

        }

      });

    }



    /*
      BREADCRUMB SCHEMA
    */

    if(breadcrumbData){

      schemas.push({

        "@context":"https://schema.org",

        "@type":"BreadcrumbList",

        itemListElement:
          breadcrumbData.map(
            (item,index)=>({

              "@type":"ListItem",

              position:index+1,

              name:item.name,

              item:item.url

            })
          )

      });

    }



    /*
      FAQ SCHEMA
    */

    if(faqData){

      schemas.push({

        "@context":"https://schema.org",

        "@type":"FAQPage",

        mainEntity:

          faqData.map(item=>({

            "@type":"Question",

            name:item.question,

            acceptedAnswer:{

              "@type":"Answer",

              text:item.answer

            }

          }))

      });

    }



    const script =
      document.createElement("script");


    script.id =
      "suko-schema";

    script.type =
      "application/ld+json";


    script.textContent =
      JSON.stringify(
        schemas
      );


    document.head.appendChild(script);



  },[
    title,
    description,
    image,
    canonicalUrl,
    type,
    productData,
    breadcrumbData,
    faqData,
    location.pathname
  ]);


  return null;

};


export default SEO;

