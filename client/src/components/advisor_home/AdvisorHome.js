/** @jsx jsx */

import NavBar from "../navbar/Navbar";
import PageSpinner from "../general/PageSpinner";
import {useEffect, useState} from "react";
import FindPlans from "./FindPlans";
import SearchResults from "./SearchResults";
import {css, jsx} from "@emotion/core";
import PropTypes from "prop-types";
import {login} from "../../utils/authService";

function AdvisorHome() {

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchFields, setSearchFields] = useState({
    textValue: "*",
    statusValue: 5,
    sortValue: 5,
    orderValue: 1
  });
  const [cursor, setCursor] = useState({
    primary: "null",
    secondary: "null"
  });

  const style = css`

    #advisor-home-container {
      margin: 100px 0 auto;
      width: 100%;
    }

    #advisor-home-contents-container {
      margin: 25px auto;
      width: 100%;
    }

  `;

  // if the sorting order changes perform a new search
  useEffect(() => {

    // set ignore and controller to prevent a memory leak
    // in the case where we need to abort early
    let ignore = false;
    const controller = new AbortController();

    // search for plans using various sorting logic
    async function searchPlans(cursor, newSearch) {
      try {
        setErrorMessage("");
        setLoading(true);
        const sortValue = searchFields.sortValue;
        const orderValue = searchFields.orderValue;

        // get search text from searchbar
        const text = document.getElementById("input-search");
        let textValue = text.value;

        // if search text is empty we use a special char to represent
        // any text response as valid
        if (textValue === "") {
          textValue = "*";
        }

        // get the status from the status select
        const status = document.getElementById("select-status");
        let statusValue = status.options[status.selectedIndex].value;

        // only set the search values if we are performing a new search
        if (newSearch) {
          setSearchFields({
            textValue: textValue,
            statusValue: statusValue,
            sortValue: sortValue,
            orderValue: orderValue
          });
        } else {
          textValue = searchFields.textValue;
          statusValue = searchFields.statusValue;
        }

        // construct the request url
        const getUrl = `/api/plan/search/${textValue}/${statusValue}/` +
          `${sortValue}/${orderValue}/${cursor.primary}/${cursor.secondary}`;
        let obj = {};

        // get our search results
        const results = await fetch(getUrl);

        // before checking the results, ensure the request was not canceled
        if (!ignore) {

          if (results.ok) {

            // if the cursor is new then we will want to relist plans
            obj = await results.json();
            if (cursor.primary === "null") {
              setPlans([...obj.plans]);
            } else {
              setPlans([...plans, ...obj.plans]);
            }
            setCursor(obj.nextCursor);

          } else {
            // we got a bad status code. Show the error
            obj = await results.json();
            setErrorMessage(obj.error);
            if (results.status === 403) {
              // if the user is not allowed to search plans,
              // redirect to login to allow updating of user info
              login();
            }
            if (results.status === 500) {
              setErrorMessage("An internal server error occurred. Please try again later.");
            }
            setPlans([]);
          }

          setLoading(false);

        }

      } catch (err) {
        if (err instanceof DOMException) {
          // if we canceled the fetch request then don't show an error message
          console.log("HTTP request aborted");
        } else {
          // show error message if error while searching
          setErrorMessage("An internal server error occurred. Please try again later.");
        }
      }

    }

    // don't load search results on the initial mount
    if (mounted) {
      const newCursor = {
        primary: "null",
        secondary: "null"
      };
      searchPlans(newCursor, false);
    } else {
      setMounted(true);
    }

    // cleanup function
    return () => {
      controller.abort();
      ignore = true;
    };

    // eslint-disable-next-line
  }, [searchFields.orderValue, searchFields.sortValue]);

  // update the sorting rules
  function handleChangeSort(sort, order) {

    setSearchFields ({
      textValue: searchFields.textValue,
      statusValue: searchFields.statusValue,
      sortValue: sort,
      orderValue: order
    });

  }

  return (
    <div id="advisor-home-page" css={style}>
      <PageSpinner loading={loading} />
      <NavBar />

      <div id="advisor-home-container">
        <div id="advisor-home-contents-container">

          <FindPlans onSearch={cursor => searchPlans(cursor, true)}/>

          <SearchResults plans={plans} cursor={cursor} error={errorMessage}
            searchFields={searchFields} loading={loading}
            onChangeSort={(sort, order) => handleChangeSort(sort, order)}
            onLoadMore={cursor => searchPlans(cursor, false)} />

        </div>
      </div>

    </div>
  );

}
export default AdvisorHome;

AdvisorHome.propTypes = {
  history: PropTypes.object
};