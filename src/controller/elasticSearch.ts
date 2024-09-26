import { transform } from 'typescript';
import { emitNewsIndexed } from '..';
import { esClient } from '../config/elasticSearch';

export const indexNewsInElasticsearch = async (news: any) => {
  console.log(news)
  try {
    await esClient.index({
      index: 'news', // Index name
      id: news.id,   // Document ID
      body: {
        headline: news.headline,
        details: news.details,
        image:news.image,
        createdAt: news.createdAt,
        author: news.author ? {
           id: news.author.id,
            name: news.author.name,
            
          } : null,
          categories: news.categories?.map((category: { id: any; name: any; }) => ({
            id: category.id,
            name: category.name,
          })),

         
      },
      
    });
  const tNews=
    emitNewsIndexed(news)

  } catch (error) {
    console.error('Error indexing news article:', error);
  }
};


export const getRecommendedNews = async (newsId: string) => {
    try {
      const result = await esClient.search({
        index: 'news',
        body: {
          query: {
            more_like_this: {
              fields: ['title', 'description'],
              like: [{ _id: newsId }], 
              min_term_freq: 1,
              max_query_terms: 12,
            },
          },
        },
      });
  
      return result.hits.hits;
    } catch (error) {
      console.error('Error fetching recommended news:', error);
      return [];
    }
  };
  export async function testElasticConnection() {
    try {
      const response = await esClient.ping();
      console.log('Elasticsearch connection successful:', response);
    } catch (error) {
      console.error('Elasticsearch connection failed:', error);
    }
  }