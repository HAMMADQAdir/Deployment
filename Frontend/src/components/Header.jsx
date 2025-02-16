import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Button, Navbar, TextInput, Dropdown, Avatar } from "flowbite-react";
import { AiOutlineSearch } from "react-icons/ai";
import { FaShoppingCart } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { signoutSuccess } from "../redux/user/userSlice";

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { items } = useSelector((state) => state.cart);
  const cartCount = currentUser ? items?.length || 0 : 0;
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (currentUser?.token && currentUser?.sessionId) {
        try {
          const decoded = jwtDecode(currentUser.token);
          const currentTime = Date.now() / 1000;

          // Check both token expiration and sessionId
          if (
            decoded.exp < currentTime ||
            decoded.sessionId !== currentUser.sessionId
          ) {
            // Session expired or invalid
            setSessionExpired(true);
            dispatch(signoutSuccess());
            setTimeout(() => {
              navigate("/sign-in");
            }, 1500); // Give users time to see the expired message
          } else {
            setSessionExpired(false);
          }
        } catch (error) {
          console.error("Token validation failed:", error);
          setSessionExpired(true);
          dispatch(signoutSuccess());
          navigate("/sign-in");
        }
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [currentUser, dispatch, navigate]);

  // Update handleSignout to handle sessionId
  const handleSignout = async () => {
    try {
      if (currentUser?.token && currentUser?.sessionId) {
        const res = await fetch("/api/user/signout", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}`,
            "Session-ID": currentUser.sessionId, // Add sessionId to headers
          },
        });

        if (!res.ok) {
          const data = await res.json();
          console.log(data.message);
        }
      }

      dispatch(signoutSuccess());
      setSessionExpired(false);
      navigate("/sign-in");
    } catch (error) {
      console.log(error.message);
      dispatch(signoutSuccess());
      setSessionExpired(false);
      navigate("/sign-in");
    }
  };

  const handleCartClick = () => {
    if (currentUser) {
      navigate("/cart");
    } else {
      navigate("/sign-in");
    }
  };

  return (
    <Navbar className="border-b-2">
      <Link
        to="/"
        className="self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white"
      >
        <span className="px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white">
          Best Book
        </span>
      </Link>
      <form>
        <TextInput
          type="text"
          placeholder="Search..."
          rightIcon={AiOutlineSearch}
          className="hidden lg:inline"
        />
      </form>
      <Button className="w-12 h-10 lg:hidden" color="gray" pill>
        <AiOutlineSearch />
      </Button>
      <div className="flex gap-2 md:order-2">
        <Button
          className="w-12 h-10 sm:inline relative"
          color="gray"
          pill
          onClick={handleCartClick}
        >
          <FaShoppingCart />
          {currentUser && cartCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {cartCount}
            </div>
          )}
        </Button>
        {currentUser && !sessionExpired ? (
          <Dropdown
            arrowIcon={false}
            inline
            label={
              <Avatar alt="user" img={currentUser.profilePicture} rounded />
            }
          >
            <Dropdown.Header>
              <span className="block text-sm">@{currentUser.username}</span>
              <span className="block text-sm font-medium truncate">
                {currentUser.email}
              </span>
            </Dropdown.Header>
            <Link to="/dashboard?tab=profile">
              <Dropdown.Item>Profile</Dropdown.Item>
            </Link>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleSignout}>Sign out</Dropdown.Item>
          </Dropdown>
        ) : (
          <Link to="/sign-in">
            <Button
              gradientDuoTone="purpleToBlue"
              outline
              className={sessionExpired ? "border-red-500" : ""}
            >
              {sessionExpired ? (
                <div className="flex flex-col items-center">
                  <span className="text-red-500">Session Expired</span>
                  <span className="text-xs">Click to Sign In</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </Link>
        )}
        <Navbar.Toggle />
      </div>
      <Navbar.Collapse>
        <Navbar.Link as={"div"}>
          <Link to="/">Home</Link>
        </Navbar.Link>
        <Navbar.Link as={"div"}>
          <Link to="/about">About</Link>
        </Navbar.Link>
        <Navbar.Link as={"div"}>
          <Link to="/orders">Orders</Link>
        </Navbar.Link>
        <Navbar.Link as={"div"}>
          <Link to="/subscribedEbooks">Your Ebooks</Link>
        </Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}
