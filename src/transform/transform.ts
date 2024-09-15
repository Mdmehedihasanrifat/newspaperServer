import { getImageUrl, getProfileImageUrl } from "../utils/helper";

// Define the types for your news and user objects
interface User {
  id?: number;
  firstName?: string;
  profile?: string;
}

interface News {
  id: number;
  title: string;
  description: string;
  image: string;
  user?: User;
  categories?: Array<{ id: number; name: string }>; // Ensure categories is an array
}

// Define the return type for your transformation function
interface TransformedNews {
  id: number;
  headline: string;
  details: string;
  image: string;
  author: {
    id?: number;
    name?: string;
    profile: string;
  };
  categories: Array<{
    id?: number;
    name?: string;
  }>;
}

export const newsTransform = (news: News): TransformedNews => {
  return {
    id: news.id,
    headline: news.title,
    details: news.description,
    image: getImageUrl(news.image),
    author: {
      id: news.user?.id, // Use optional chaining to avoid errors if user is undefined
      name: news.user?.firstName,
      profile: news.user?.profile
        ? getProfileImageUrl(news.user.profile)
        : "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.vecteezy.com%2Ffree-vector%2Fprofile-avatar&psig=AOvVaw1tqVhpAdxSIWMi59j-165o&ust=1726065127132000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCOCT7ufLuIgDFQAAAAAdAAAAABAE"
    },
    categories: news.categories?.map((category: any) => ({
      id: category.id,
      name: category.name,
    })) || [] // Map the categories and default to an empty array if undefined
  };
};

