if [[ $TRAVIS_PULL_REQUEST == 'false' ]] && [[ $TRAVIS_BRANCH == 'master' ]]; then
  if [ $GH_TOKEN ]; then
    gulp test_single
    gulp deploy 2> /dev/null
  fi
else
  gulp test_single
fi
