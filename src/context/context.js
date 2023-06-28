import React, { useState, useEffect, useContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";
import { createContext } from "react";

const rootUrl = "https://api.github.com";

const GithubContext = createContext();

export const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  const [request, setRequest] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubUser = async (user) => {
    toggleError();
    setLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((results) => {
          const [repos, followers] = results;
          const status = "fulfilled";
          console.log(results);

          if (repos.status === status) {
            setRepos(repos.value.data);
          }
          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      toggleError(true, "not found");
    }
    checkRequest();
    setLoading(false);
  };

  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  const checkRequest = async () => {
    try {
      const { data } = await axios(`${rootUrl}/rate_limit`);
      let {
        rate: { remaining },
      } = data;
      setRequest(remaining);
      if (remaining === 0) {
        toggleError(true, "sorrym no more request...");
      }
      return remaining;
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => checkRequest, []);
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        followers,
        repos,
        request,
        error,
        loading,
        searchGithubUser,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export const useHubContext = () => {
  return useContext(GithubContext);
};
