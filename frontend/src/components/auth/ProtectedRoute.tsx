// import { Navigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import { RootState } from '../../store';
// import LoadingOverlay from '../common/LoadingOverlay';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // const { isAuthenticated, isLoading, checkingAuth } = useSelector((state: RootState) => state.auth);
  
  // // 認証チェック中は何も表示しない
  // if (isLoading || checkingAuth) {
  //   return <LoadingOverlay />;
  // }

  // // 未認証の場合はログインページへリダイレクト
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  return children;
}